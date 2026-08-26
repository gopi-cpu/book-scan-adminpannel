"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  adminListThreads,
  adminGetThread,
  adminReplyToThread,
  adminUpdateThreadStatus,
  SupportThreadSummary,
  SupportThreadDetail,
  ApiError
} from "@/lib/api";

const POLL_MS = 8000;

export default function InboxPage() {
  const { token } = useAuth();
  const [threads, setThreads] = useState<SupportThreadSummary[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<SupportThreadDetail | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadThreads() {
    if (!token) return;
    try {
      const list = await adminListThreads(token);
      setThreads(list);
      if (!activeId && list.length > 0) setActiveId(list[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load the inbox.");
    }
  }

  async function loadThread(id: string) {
    if (!token) return;
    try {
      setThread(await adminGetThread(token, id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load this conversation.");
    }
  }

  useEffect(() => {
    loadThreads();
    pollRef.current = setInterval(loadThreads, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (activeId) loadThread(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, token]);

  useEffect(() => {
    if (!activeId) return;
    const id = setInterval(() => loadThread(activeId), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, token]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !activeId || !reply.trim()) return;
    setSending(true);
    try {
      await adminReplyToThread(token, activeId, reply.trim());
      setReply("");
      await loadThread(activeId);
      await loadThreads();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send your reply.");
    } finally {
      setSending(false);
    }
  }

  async function toggleThreadStatus() {
    if (!token || !thread) return;
    const nextStatus = thread.status === "Open" ? "Closed" : "Open";
    try {
      await adminUpdateThreadStatus(token, thread.id, nextStatus);
      setThread((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      loadThreads();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this conversation.");
    }
  }

  return (
    <div>
      <h1 className="text-2xl mb-6">Inbox</h1>
      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      <div className="flex border border-border rounded-2xl overflow-hidden" style={{ height: "70vh" }}>
        <div className="w-72 flex-shrink-0 border-r border-border overflow-y-auto bg-bg-alt">
          {!threads ? (
            <p className="text-sm text-ink-muted p-4">Loading...</p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-ink-muted p-4">No conversations yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                  activeId === t.id ? "bg-white" : "hover:bg-white/60"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-semibold text-ink truncate">{t.user.name}</span>
                  {t.status === "Open" ? <span className="w-2 h-2 rounded-full bg-teal flex-shrink-0" /> : null}
                </div>
                <p className="text-xs text-ink-muted truncate">
                  {t.lastSender === "admin" ? "You: " : ""}
                  {t.lastMessage || "No messages"}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {!thread ? (
            <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">Select a conversation</div>
          ) : (
            <>
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{thread.user.name}</p>
                  <p className="text-xs text-ink-muted">{thread.user.phone}</p>
                </div>
                <button
                  onClick={toggleThreadStatus}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                    thread.status === "Open" ? "bg-mint text-teal-dark" : "bg-bg-alt text-ink-muted"
                  }`}
                >
                  {thread.status === "Open" ? "Mark closed" : "Reopen"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-bg-alt">
                {thread.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderType === "admin" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.senderType === "admin" ? "bg-teal text-white" : "bg-white text-ink border border-border"
                      }`}
                    >
                      {m.message}
                      <p className={`text-[10px] mt-1 ${m.senderType === "admin" ? "text-white/70" : "text-ink-muted"}`}>
                        {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="bg-teal text-white px-4 rounded-lg disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
