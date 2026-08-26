"use client";

import AdminCrudTable from "@/components/AdminCrudTable";
import {
  adminFetchHeroSlides,
  adminCreateHeroSlide,
  adminUpdateHeroSlide,
  adminDeleteHeroSlide,
  AdminHeroSlide
} from "@/lib/api";

const ILLUSTRATION_OPTIONS = ["brand", "offer", "package", "home"].map((v) => ({ value: v, label: v }));
const BG_OPTIONS = ["bg-mint", "bg-sky", "bg-gold-bg", "bg-lavender", "bg-peach", "bg-rose"].map((v) => ({ value: v, label: v }));
const ACCENT_OPTIONS = ["text-teal-dark", "text-primary", "text-gold"].map((v) => ({ value: v, label: v }));

export default function AdminHeroSlidesPage() {
  return (
    <AdminCrudTable<AdminHeroSlide>
      title="Hero sliders"
      addLabel="Add slide"
      columns={[
        { key: "title", label: "Title" },
        { key: "eyebrow", label: "Eyebrow" },
        { key: "order", label: "Order" },
        { key: "active", label: "Active", render: (s) => (s.active ? "Yes" : "No") }
      ]}
      fields={[
        { key: "eyebrow", label: "Eyebrow", type: "text", required: true },
        { key: "title", label: "Title", type: "text", required: true },
        { key: "subtitle", label: "Subtitle", type: "textarea", required: true },
        { key: "cta", label: "Button label", type: "text", required: true },
        { key: "href", label: "Button link (e.g. /scans)", type: "text", required: true },
        { key: "illustration", label: "Illustration", type: "select", options: ILLUSTRATION_OPTIONS },
        { key: "bg", label: "Background color", type: "select", options: BG_OPTIONS },
        { key: "accent", label: "Accent text color", type: "select", options: ACCENT_OPTIONS },
        { key: "order", label: "Sort order", type: "number" },
        { key: "active", label: "Active", type: "checkbox" }
      ]}
      fetchList={adminFetchHeroSlides}
      createItem={(t, p) => adminCreateHeroSlide(t, p as any)}
      updateItem={(t, id, p) => adminUpdateHeroSlide(t, id, p as any)}
      deleteItem={adminDeleteHeroSlide}
      emptyForm={{
        eyebrow: "",
        title: "",
        subtitle: "",
        cta: "Book a test",
        href: "/scans",
        illustration: "brand",
        bg: "bg-mint",
        accent: "text-teal-dark",
        order: 0,
        active: true
      }}
    />
  );
}
