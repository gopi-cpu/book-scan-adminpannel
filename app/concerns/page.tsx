"use client";

import AdminCrudTable from "@/components/AdminCrudTable";
import {
  adminFetchConcerns,
  adminCreateConcern,
  adminUpdateConcern,
  adminDeleteConcern,
  AdminConcern
} from "@/lib/api";

const ICON_OPTIONS = [
  "thermometer", "diabetes", "kidney", "heart", "liver", "bone", "pregnancy",
  "brain", "chest", "spine", "abdomen", "joints", "drop", "thyroid", "vitamin"
].map((v) => ({ value: v, label: v }));

const COLOR_OPTIONS = ["d-lav", "d-peach", "d-sky", "d-mint", "d-rose", "d-gold"].map((v) => ({ value: v, label: v }));

export default function AdminConcernsPage() {
  return (
    <AdminCrudTable<AdminConcern>
      title="Health concerns"
      addLabel="Add concern"
      columns={[
        { key: "name", label: "Name" },
        { key: "icon", label: "Icon" },
        { key: "keywords", label: "Keywords", render: (c) => c.keywords.join(", ") },
        { key: "order", label: "Order" }
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
        { key: "colorClass", label: "Color", type: "select", options: COLOR_OPTIONS },
        { key: "keywords", label: "Keywords (matched against test names)", type: "tags" },
        { key: "order", label: "Sort order", type: "number" }
      ]}
      fetchList={adminFetchConcerns}
      createItem={(t, p) => adminCreateConcern(t, p as any)}
      updateItem={(t, id, p) => adminUpdateConcern(t, id, p as any)}
      deleteItem={adminDeleteConcern}
      emptyForm={{ name: "", icon: "thermometer", colorClass: "d-sky", keywords: [], order: 0 }}
    />
  );
}
