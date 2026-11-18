"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  CreditCard,
  BarChart3,
  UserPlus,
  Inbox,
  Users,
  Building2,
  Activity,
  Layers,
  Stethoscope,
  PersonStanding,
  HeartPulse,
  GalleryHorizontal,
  LogOut
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/tracker", label: "Tracker", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: UserPlus },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/users", label: "Users", icon: Users },
  { href: "/centers", label: "Diagnostic Centers", icon: Building2 },
  { href: "/scan-types", label: "Scan Types", icon: Activity },
  { href: "/modalities", label: "Modalities / Categories", icon: Layers },
  { href: "/catalog", label: "Scans / Tests / Packages", icon: Stethoscope },
  { href: "/body-parts", label: "Body Parts", icon: PersonStanding },
  { href: "/concerns", label: "Health Concerns", icon: HeartPulse },
  { href: "/hero-slides", label: "Hero Sliders", icon: GalleryHorizontal }
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 flex-shrink-0 bg-primary-dark text-white min-h-screen flex flex-col">
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex flex-col gap-2">
          <div className="bg-white/95 rounded-xl px-3 py-2 flex items-center justify-center shadow-sm">
            <img src="/relyd-logo.png" alt="RelyD" className="h-7 w-auto object-contain" />
          </div>
          <span className="text-[11px] font-medium text-[#CFE3EA] tracking-wide uppercase text-center">Admin Portal</span>
        </div>
      </div>
      <nav className="flex-1 py-4">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                active ? "bg-white/10 text-white border-r-2 border-teal" : "text-[#CFE3EA] hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-[#A9C2CB] truncate mb-3">{user.phone}</p>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="flex items-center gap-2 text-xs font-semibold text-[#CFE3EA] hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      )}
    </aside>
  );
}
