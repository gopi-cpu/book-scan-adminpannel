"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import NotificationBell from "./NotificationBell";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function TopHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/bookings?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="border-b border-border bg-white px-6 py-3.5 flex items-center gap-4">
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patient name or phone..."
          className="w-full border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-teal"
        />
      </form>

      <div className="flex items-center gap-3 ml-auto">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center"
          >
            {user ? initials(user.name) : "?"}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border rounded-xl shadow-[0_10px_30px_rgba(11,79,108,0.16)] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-ink truncate">{user?.name}</p>
                  <p className="text-xs text-ink-muted truncate">{user?.phone}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    router.push("/login");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-bg-alt"
                >
                  <LogOut className="w-3.5 h-3.5 text-ink-muted" /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
