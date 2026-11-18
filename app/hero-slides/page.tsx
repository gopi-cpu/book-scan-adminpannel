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
        {
          key: "imageUrl",
          label: "Banner Image",
          render: (s) =>
            s.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <div className="flex items-center gap-2.5">
                <img
                  src={s.imageUrl}
                  alt={s.title}
                  className="w-14 h-9 object-cover rounded-lg border border-border shadow-2xs"
                />
                <span className="text-[11px] text-ink-muted max-w-[130px] truncate">
                  {s.imageUrl.split("/").pop()}
                </span>
              </div>
            ) : (
              <span className="text-xs text-ink-muted italic">Illustration</span>
            )
        },
        { key: "title", label: "Title" },
        { key: "eyebrow", label: "Eyebrow" },
        { key: "order", label: "Order" },
        { key: "active", label: "Active", render: (s) => (s.active ? "Yes" : "No") }
      ]}
      fields={[
        { key: "eyebrow", label: "Eyebrow", type: "text", required: true },
        { key: "title", label: "Title", type: "text", required: true },
        { key: "subtitle", label: "Subtitle", type: "textarea", required: true },
        {
          key: "imageUrl",
          label: "Banner Image",
          type: "image",
          required: false,
          helpText: "Upload any PNG/JPG image file from your computer or pick from the standard presets below."
        },
        {
          key: "badge1",
          label: "Floating Badge 1 (Top-Left)",
          type: "text",
          required: false,
          helpText: "e.g. ⭐ 4.9/5 Rating (50k+ Families)"
        },
        {
          key: "badge2",
          label: "Floating Badge 2 (Bottom-Right)",
          type: "text",
          required: false,
          helpText: "e.g. ⚡ Reports within 24 Hours"
        },
        { key: "cta", label: "Button label", type: "text", required: true },
        { key: "href", label: "Button link (e.g. /scans)", type: "text", required: true },
        { key: "illustration", label: "Illustration Key", type: "select", options: ILLUSTRATION_OPTIONS },
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
        imageUrl: "/images/banner-1-family.png",
        badge1: "",
        badge2: "",
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
