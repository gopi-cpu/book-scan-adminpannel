"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Activity } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  adminFetchScanTypes,
  adminCreateScanType,
  adminUpdateScanType,
  adminDeleteScanType,
  AdminScanType
} from "@/lib/api";

const TINT_OPTIONS = [
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "teal", label: "Teal" },
  { value: "amber", label: "Amber" },
  { value: "rose", label: "Rose" }
];

export default function AdminScanTypesPage() {
  const { token } = useAuth();
  const [types, setTypes] = useState<AdminScanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminScanType | null>(null);
  const [form, setForm] = useState({
    label: "",
    slug: "",
    tint: "blue",
    blurb: "",
    sortOrder: 0
  });

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await adminFetchScanTypes(token);
      setTypes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [token]);

  function openCreate() {
    setEditingItem(null);
    setForm({ label: "", slug: "", tint: "blue", blurb: "", sortOrder: types.length + 1 });
    setModalOpen(true);
  }

  function openEdit(item: AdminScanType) {
    setEditingItem(item);
    setForm({
      label: item.label,
      slug: item.slug,
      tint: item.tint,
      blurb: item.blurb,
      sortOrder: item.sortOrder
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !form.label.trim()) return;
    try {
      if (editingItem) {
        await adminUpdateScanType(token, editingItem.id, form);
      } else {
        await adminCreateScanType(token, form);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      alert(err.message || "Could not save scan type");
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm("Are you sure you want to delete this scan type?")) return;
    try {
      await adminDeleteScanType(token, id);
      load();
    } catch (err: any) {
      alert(err.message || "Could not delete scan type");
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Scan Types</h1>
          <p className="text-sm text-ink-muted">Manage radiology scan types and imaging modalities (MRI, CT, X-Ray, etc.)</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-teal hover:bg-teal-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Scan Type
        </button>
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-alt border-b border-border text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-5 py-3 font-bold">Scan Type Name</th>
              <th className="px-5 py-3 font-bold">Slug / Code</th>
              <th className="px-5 py-3 font-bold">Tint / Color</th>
              <th className="px-5 py-3 font-bold">Description</th>
              <th className="px-5 py-3 font-bold">Sort Order</th>
              <th className="px-5 py-3 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  Loading scan types...
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  No scan types found. Click &quot;Add Scan Type&quot; above to create one.
                </td>
              </tr>
            ) : (
              types.map((item) => (
                <tr key={item.id} className="hover:bg-bg-alt/50 transition">
                  <td className="px-5 py-3.5 font-bold text-primary-dark flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal" />
                    {item.label}
                  </td>
                  <td className="px-5 py-3.5 text-ink font-mono text-xs">{item.slug}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-sky text-teal border border-teal/20 capitalize">
                      {item.tint}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-muted max-w-xs truncate">{item.blurb || "—"}</td>
                  <td className="px-5 py-3.5 text-ink">{item.sortOrder}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg border border-border hover:border-teal hover:text-teal transition cursor-pointer"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-primary-dark mb-4">
              {editingItem ? "Edit Scan Type" : "Add Scan Type"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Name / Label
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. MRI, CT Scan, Ultrasound, X-Ray"
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Slug / URL Code
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="e.g. mri, ct-scan (leave blank to auto-generate)"
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Tint / Color
                </label>
                <select
                  value={form.tint}
                  onChange={(e) => setForm({ ...form, tint: e.target.value })}
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal bg-white"
                >
                  {TINT_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Description / Blurb
                </label>
                <textarea
                  value={form.blurb}
                  onChange={(e) => setForm({ ...form, blurb: e.target.value })}
                  rows={2}
                  placeholder="Short description of the scan..."
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-teal hover:bg-teal-dark text-white font-semibold py-2.5 rounded-xl transition cursor-pointer"
                >
                  Save Scan Type
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-ink-muted hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
