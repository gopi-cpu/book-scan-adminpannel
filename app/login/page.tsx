"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { apiLogin, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim() || !password) {
      setError("Enter your phone number and password.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const { token, user } = await apiLogin({ phone: phone.trim(), password });
      if (!user.isAdmin) {
        setError("This account doesn't have admin access.");
        setSubmitting(false);
        return;
      }
      setSession(token, user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-bg-alt">
      <div className="w-full max-w-[400px]">
        <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl text-center mb-1.5">ScanEase Admin</h1>
        <p className="text-sm text-ink-muted text-center mb-8">
          Log in with an account that has admin access.
        </p>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">
              Phone number
            </label>
            <input
              type="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98765 43210"
              className="w-full border border-border rounded-lg px-3.5 py-3 text-sm outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-border rounded-lg px-3.5 py-3 text-sm outline-none focus:border-teal"
            />
          </div>
          {error && <p className="text-xs font-semibold text-[#A32D2D]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white font-semibold text-sm px-6 py-3 rounded-lg disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-xs text-ink-muted text-center mt-5">
          Admin accounts are created on the main ScanEase site, then promoted via{" "}
          <code className="bg-white border border-border rounded px-1.5 py-0.5">npm run make-admin</code> on the
          backend.
        </p>
      </div>
    </div>
  );
}
