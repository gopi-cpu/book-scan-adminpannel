"use client";

import AdminCrudTable from "@/components/AdminCrudTable";
import {
  adminFetchCatalog,
  adminCreateCatalogItem,
  adminUpdateCatalogItem,
  adminDeleteCatalogItem,
  AdminCatalogItem
} from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";

const ICON_OPTIONS = [
  "xray", "bone", "heart", "ctscan", "mri", "brain", "lungs", "ultrasound", "drop",
  "thyroid", "vitamin", "thermometer", "diabetes", "kidney", "liver", "pregnancy",
  "package", "spine", "chest", "joints", "abdomen"
].map((v) => ({ value: v, label: v }));

const COLOR_OPTIONS = ["d-lav", "d-peach", "d-sky", "d-mint", "d-rose", "d-gold"].map((v) => ({ value: v, label: v }));

export default function AdminCatalogPage() {
  return (
    <AdminCrudTable<AdminCatalogItem>
      title="Scans, tests & packages"
      addLabel="Add item"
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "group", label: "Group" },
        { key: "now", label: "Price", render: (i) => `${fmtPrice(i.now)} (was ${fmtPrice(i.was)})` },
        { key: "popular", label: "Popular", render: (i) => (i.popular ? "Yes" : "No") }
      ]}
      fields={[
        { key: "name", label: "Name", type: "text", required: true },
        {
          key: "type",
          label: "Type",
          type: "select",
          options: [
            { value: "scan", label: "Scan" },
            { value: "pathology", label: "Pathology" },
            { value: "package", label: "Package" }
          ]
        },
        { key: "group", label: "Group (e.g. MRI, Blood Tests, Packages)", type: "text", required: true },
        { key: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
        { key: "colorClass", label: "Color", type: "select", options: COLOR_OPTIONS },
        { key: "was", label: "Original price (₹)", type: "number", required: true },
        { key: "now", label: "Current price (₹)", type: "number", required: true },
        {
          key: "modality",
          label: "Modality (scans only: CT, MRI, X-Ray, Ultrasound, Other)",
          type: "text"
        },
        {
          key: "bodyPart",
          label: "Body part (scans only: Spine, Brain, Chest, Joints, Abdomen)",
          type: "text"
        },
        { key: "meta", label: "Meta line (e.g. 'Reports in 24 hrs')", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "popular", label: "Popular (shown by default)", type: "checkbox" },
        { key: "featured", label: "Featured (Best value badge)", type: "checkbox" },
        { key: "order", label: "Sort order", type: "number" }
      ]}
      fetchList={adminFetchCatalog}
      createItem={(t, p) => adminCreateCatalogItem(t, p as any)}
      updateItem={(t, id, p) => adminUpdateCatalogItem(t, id, p as any)}
      deleteItem={adminDeleteCatalogItem}
      emptyForm={{
        name: "",
        type: "scan",
        group: "",
        icon: "xray",
        colorClass: "d-sky",
        was: 0,
        now: 0,
        modality: "",
        bodyPart: "",
        meta: "",
        description: "",
        popular: false,
        featured: false,
        order: 0
      }}
    />
  );
}
