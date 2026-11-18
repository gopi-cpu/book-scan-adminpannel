"use client";

import AdminCrudTable from "@/components/AdminCrudTable";
import {
  adminFetchModalities,
  adminCreateModality,
  adminUpdateModality,
  adminDeleteModality,
  AdminModality
} from "@/lib/api";

const ICON_OPTIONS = [
  "scan",
  "drop",
  "package",
  "bone",
  "heart",
  "brain",
  "activity",
  "microscope",
  "flask-conical"
].map((v) => ({ value: v, label: v }));

const COLOR_OPTIONS = ["d-sky", "d-mint", "d-gold", "d-rose", "d-lav", "d-peach"].map((v) => ({
  value: v,
  label: v
}));

export default function AdminModalitiesPage() {
  return (
    <AdminCrudTable<AdminModality>
      title="Modalities / Categories"
      addLabel="Add Modality"
      columns={[
        { key: "name", label: "Name" },
        { key: "key", label: "Code / Slug" },
        { key: "icon", label: "Icon" },
        { key: "sortOrder", label: "Sort Order" },
        { key: "active", label: "Active", render: (m) => (m.active ? "Yes" : "No") }
      ]}
      fields={[
        { key: "key", label: "Code / Slug (e.g. scan, pathology, package, bms)", type: "text", required: true },
        { key: "name", label: "Display Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
        { key: "colorClass", label: "Color Theme", type: "select", options: COLOR_OPTIONS },
        { key: "sortOrder", label: "Sort Order", type: "number" },
        { key: "active", label: "Active", type: "checkbox" }
      ]}
      fetchList={adminFetchModalities}
      createItem={(t, p) => adminCreateModality(t, p as any)}
      updateItem={(t, id, p) => adminUpdateModality(t, id, p as any)}
      deleteItem={adminDeleteModality}
      emptyForm={{
        key: "",
        name: "",
        description: "",
        icon: "scan",
        colorClass: "d-sky",
        sortOrder: 0,
        active: true
      }}
    />
  );
}
