"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox" | "tags" | "password";
  options?: { value: string; label: string }[];
  required?: boolean;
  helpText?: string;
}

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface AdminCrudTableProps<T extends { id: number }> {
  title: string;
  addLabel: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  fetchList: (token: string) => Promise<T[]>;
  createItem: (token: string, payload: Record<string, unknown>) => Promise<T>;
  updateItem: (token: string, id: number, payload: Record<string, unknown>) => Promise<T>;
  deleteItem: (token: string, id: number) => Promise<void>;
  emptyForm: Record<string, unknown>;
  toForm?: (item: T) => Record<string, unknown>;
}

export default function AdminCrudTable<T extends { id: number }>({
  title,
  addLabel,
  columns,
  fields,
  fetchList,
  createItem,
  updateItem,
  deleteItem,
  emptyForm,
  toForm
}: AdminCrudTableProps<T>) {
  const { token } = useAuth();
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!token) return;
    try {
      setItems(await fetchList(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditingId(item.id);
    setForm(toForm ? toForm(item) : { ...item });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      if (editingId != null) {
        const updated = await updateItem(token, editingId, form);
        setItems((prev) => (prev ? prev.map((i) => (i.id === editingId ? updated : i)) : prev));
      } else {
        const created = await createItem(token, form);
        setItems((prev) => (prev ? [...prev, created] : [created]));
      }
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!token || !window.confirm("Delete this item? This can't be undone.")) return;
    try {
      await deleteItem(token, id);
      setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete.");
    }
  }

  function setField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ink-muted">
          {items ? `${items.length} ${title.toLowerCase()}` : "Loading..."}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal px-3.5 py-2 rounded-lg hover:brightness-95"
        >
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      </div>

      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      <div className="border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-alt text-left">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!items ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-ink-muted">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-ink-muted">
                  Nothing here yet.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-b-0">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-ink">
                      {c.render ? c.render(item) : String((item as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="w-7 h-7 rounded-full bg-sky text-[#2E6690] flex items-center justify-center"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-7 h-7 rounded-full bg-rose text-[#C15A85] flex items-center justify-center"
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

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-ink-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl mb-5">{editingId != null ? `Edit ${title.slice(0, -1)}` : addLabel}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">{f.label}</label>
                  {f.helpText && <p className="text-[11px] text-ink-muted -mt-1 mb-1.5">{f.helpText}</p>}
                  {f.type === "textarea" ? (
                    <textarea
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setField(f.key, e.target.value)}
                      rows={3}
                      className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal bg-white"
                    >
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(form[f.key])}
                      onChange={(e) => setField(f.key, e.target.checked)}
                      className="w-4 h-4"
                    />
                  ) : f.type === "tags" ? (
                    <input
                      type="text"
                      value={Array.isArray(form[f.key]) ? (form[f.key] as string[]).join(", ") : ""}
                      onChange={(e) => setField(f.key, e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                      placeholder="comma, separated, keywords"
                      className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                    />
                  ) : (
                    <input
                      type={f.type}
                      value={String(form[f.key] ?? "")}
                      onChange={(e) => setField(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                      required={f.required}
                      className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                    />
                  )}
                </div>
              ))}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-teal text-white font-semibold text-sm px-6 py-3 rounded-lg disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
