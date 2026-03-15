"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthCard from "@/components/auth/AuthCard";
import { useAuth } from "@/contexts/AuthContext";

export default function PendingApprovalPage() {
  const { user, accessToken, isLoading, logout } = useAuth();
  const router                                   = useRouter();

  useEffect(() => {
    if (isLoading) return; // wait for silent session restore
    if (!accessToken) { router.replace("/login"); return; }
    if (user?.accountStatus === "approved") router.replace("/");
  }, [accessToken, user, isLoading, router]);

  const handleSignOut = async () => { await logout(); router.replace("/login"); };

  if (isLoading || !accessToken) return null;

  return (
    <AuthPageShell>
      <AuthCard
        title="Application under review"
        subtitle="Your profile has been submitted and is awaiting administrator approval."
      >
        {/* Clock illustration */}
        <div className="flex justify-center py-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-center">
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            An administrator will review your application and approve or reject it.
            This typically takes <strong className="text-[#111]">one to three business days</strong>.
          </p>
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            You will receive an email notification at{" "}
            <strong className="text-[#111]">{user?.email ?? "your email address"}</strong>{" "}
            once a decision has been made.
          </p>
          <p className="text-[12px] text-[#9CA3AF]">
            Nothing to do now — we&apos;ll be in touch.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-12 rounded-3xl border border-[#E5E7EB] text-[14px] font-semibold text-[#374151] hover:bg-[#F9FAFB] transition-colors"
        >
          Sign out
        </button>
      </AuthCard>
    </AuthPageShell>
  );
}
