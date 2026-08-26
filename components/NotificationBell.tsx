"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminFetchNotifications, adminMarkNotificationRead, adminMarkAllNotificationsRead, Notification } from "@/lib/api";

const POLL_MS = 15000;

export default function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    if (!token) return;
    try {
      const data = await adminFetchNotifications(token);
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {
      // silent — notifications are non-critical
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleOpenNotification(n: Notification) {
    if (!token) return;
    if (!n.read) {
      await adminMarkNotificationRead(token, n.id);
      load();
    }
  }

  async function handleMarkAllRead() {
    if (!token) return;
    await adminMarkAllNotificationsRead(token);
    load();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#CFE3EA] hover:text-white hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-gold text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-primary-dark">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-border rounded-xl shadow-[0_10px_30px_rgba(11,79,108,0.16)] overflow-hidden z-50 text-ink">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs font-semibold text-teal-dark">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-6">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => {
                    handleOpenNotification(n);
                    setOpen(false);
                  }}
                  className={`block px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg-alt ${
                    !n.read ? "bg-mint/40" : ""
                  }`}
                >
                  <p className="text-sm text-ink">{n.message}</p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {new Date(n.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
