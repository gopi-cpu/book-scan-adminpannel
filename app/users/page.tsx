"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, ShieldCheck, ShieldOff, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  adminFetchUsers,
  adminUpdateUser,
  adminSetUserAdmin,
  adminDeleteUser,
  ManagedUser,
  ApiError
} from "@/lib/api";

const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  admin: "Admin",
  center_staff: "Center Staff"
};

export default function UsersPage() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", age: "", gender: "" });

  async function load(q?: string) {
    if (!token) return;
    try {
      setUsers(await adminFetchUsers(token, q));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load users.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(search);
  }

  function startEdit(u: ManagedUser) {
    setEditingId(u.id);
    setForm({ name: u.name, phone: u.phone, age: u.age || "", gender: u.gender || "" });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !editingId) return;
    try {
      const updated = await adminUpdateUser(token, editingId, form);
      setUsers((prev) => (prev ? prev.map((u) => (u.id === editingId ? updated : u)) : prev));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes.");
    }
  }

  async function toggleAdmin(u: ManagedUser) {
    if (!token) return;
    try {
      const updated = await adminSetUserAdmin(token, u.id, !u.isAdmin);
      setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? updated : x)) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update admin access.");
    }
  }

  async function handleDelete(u: ManagedUser) {
    if (!token || !window.confirm(`Delete ${u.name}? This can't be undone.`)) return;
    try {
      await adminDeleteUser(token, u.id);
      setUsers((prev) => (prev ? prev.filter((x) => x.id !== u.id) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete this user.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl">Users &amp; admins</h1>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or phone..."
            className="border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-teal w-64"
          />
        </form>
      </div>

      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      <div className="border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-alt text-left">
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Name</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Phone</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Role</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Joined</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!users ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3.5 font-semibold text-ink">
                    {u.name}
                    {u.isAdmin && (
                      <span className="ml-2 text-[10px] font-bold uppercase text-teal-dark bg-mint px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-ink-muted">{u.phone}</td>
                  <td className="px-4 py-3.5 text-ink-muted">{ROLE_LABEL[u.role]}</td>
                  <td className="px-4 py-3.5 text-ink-muted whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        className="w-7 h-7 rounded-full bg-sky text-[#2E6690] flex items-center justify-center"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleAdmin(u)}
                        disabled={u.id === me?.id}
                        className={`w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40 ${
                          u.isAdmin ? "bg-gold-bg text-gold" : "bg-bg-alt text-ink-muted"
                        }`}
                        title={u.isAdmin ? "Remove admin access" : "Grant admin access"}
                      >
                        {u.isAdmin ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === me?.id}
                        className="w-7 h-7 rounded-full bg-rose text-[#C15A85] flex items-center justify-center disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl mb-5">Edit user</h2>
            <form onSubmit={saveEdit} className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Name"
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="Age"
                  className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                />
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal bg-white"
                >
                  <option value="">Sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-teal text-white font-semibold text-sm px-6 py-2.5 rounded-lg">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
