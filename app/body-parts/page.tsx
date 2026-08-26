"use client";

import AdminCrudTable from "@/components/AdminCrudTable";
import {
  adminFetchBodyParts,
  adminCreateBodyPart,
  adminUpdateBodyPart,
  adminDeleteBodyPart,
  AdminBodyPart
} from "@/lib/api";

const ICON_OPTIONS = [
  "brain", "chest", "spine", "abdomen", "joints", "thermometer", "diabetes",
  "kidney", "heart", "liver", "bone", "pregnancy", "ctscan", "mri", "xray",
  "ultrasound", "drop", "thyroid", "vitamin", "package"
].map((v) => ({ value: v, label: v }));

const COLOR_OPTIONS = ["d-lav", "d-peach", "d-sky", "d-mint", "d-rose", "d-gold"].map((v) => ({ value: v, label: v }));

export default function AdminBodyPartsPage() {
  return (
    <AdminCrudTable<AdminBodyPart>
      title="Body parts"
      addLabel="Add body part"
      columns={[
        { key: "name", label: "Name" },
        { key: "icon", label: "Icon" },
        { key: "colorClass", label: "Color" },
        { key: "order", label: "Order" }
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
        { key: "colorClass", label: "Color", type: "select", options: COLOR_OPTIONS },
        { key: "order", label: "Sort order", type: "number" }
      ]}
      fetchList={adminFetchBodyParts}
      createItem={(t, p) => adminCreateBodyPart(t, p as any)}
      updateItem={(t, id, p) => adminUpdateBodyPart(t, id, p as any)}
      deleteItem={adminDeleteBodyPart}
      emptyForm={{ name: "", icon: "brain", colorClass: "d-lav", order: 0 }}
    />
  );
}
