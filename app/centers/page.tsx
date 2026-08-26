"use client";

import Link from "next/link";
import { DollarSign } from "lucide-react";
import AdminCrudTable from "@/components/AdminCrudTable";
import {
  adminFetchCenters,
  adminCreateCenter,
  adminUpdateCenter,
  adminDeleteCenter,
  DiagnosticCenter
} from "@/lib/api";

export default function AdminCentersPage() {
  return (
    <div>
      <AdminCrudTable<DiagnosticCenter>
        title="Diagnostic centers"
        addLabel="Add center"
        columns={[
          { key: "name", label: "Name" },
          { key: "branch", label: "Branch" },
          { key: "city", label: "City" },
          {
            key: "staffPhone",
            label: "Login",
            render: (c) => (c.staffPhone ? `${c.staffName} · ${c.staffPhone}` : <span className="text-ink-muted">Not set up</span>)
          },
          { key: "active", label: "Active", render: (c) => (c.active ? "Yes" : "No") },
          {
            key: "pricing",
            label: "Pricing",
            render: (c) => (
              <Link
                href={`/centers/${c.id}/pricing`}
                className="flex items-center gap-1 text-xs font-semibold text-teal-dark hover:underline w-fit"
              >
                <DollarSign className="w-3 h-3" /> Manage
              </Link>
            )
          }
        ]}
        fields={[
          { key: "name", label: "Name", type: "text", required: true },
          { key: "branch", label: "Branch", type: "text", required: true },
          { key: "city", label: "City", type: "text" },
          { key: "active", label: "Active", type: "checkbox" },
          {
            key: "staffName",
            label: "Staff contact name",
            type: "text",
            helpText: "Who logs into the diagnostic portal for this center."
          },
          { key: "staffPhone", label: "Staff phone (login username)", type: "text" },
          {
            key: "staffPassword",
            label: "Staff password",
            type: "password",
            helpText: "Leave blank when editing to keep the current password. At least 6 characters when setting a new one."
          }
        ]}
        fetchList={adminFetchCenters}
        createItem={(t, p) => adminCreateCenter(t, p as any)}
        updateItem={(t, id, p) => adminUpdateCenter(t, id, p as any)}
        deleteItem={adminDeleteCenter}
        emptyForm={{ name: "", branch: "", city: "", active: true, staffName: "", staffPhone: "", staffPassword: "" }}
      />
    </div>
  );
}
