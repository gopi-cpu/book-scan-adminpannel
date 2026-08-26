"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace("/login");
    }
  }, [loading, user, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-muted text-sm">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-[420px] text-center">
          <div className="w-16 h-16 rounded-full bg-rose text-[#C15A85] flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl mb-2.5">Admin access required</h1>
          <p className="text-ink-muted text-sm mb-6">
            The account {user.phone} doesn&apos;t have admin permissions on this ScanEase deployment.
          </p>
          <button onClick={logout} className="text-sm font-semibold text-teal-dark">
            Log out and try a different account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 p-6 sm:p-8 overflow-x-hidden bg-bg-alt">{children}</main>
      </div>
    </div>
  );
}
