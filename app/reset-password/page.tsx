"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthCard from "@/components/auth/AuthCard";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthBar, { calcPasswordScore } from "@/components/auth/PasswordStrengthBar";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { useToast } from "@/contexts/ToastContext";
import { setRedirectToast } from "@/lib/toast/redirect-toast";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

function ResetPasswordContent() {
  const params  = useSearchParams();
  const token   = params.get("token");
  const router  = useRouter();
  const { toast } = useToast();

  const [password,        setPassword]        = useState("");
  const [confirm,         setConfirm]         = useState("");
  const [confirmError,    setConfirmError]    = useState("");
  const [loading,         setLoading]         = useState(false);

  const passwordScore = calcPasswordScore(password);

  // No token in URL — show error immediately, no form
  if (!token) {
    return (
      <AuthCard
        title="Invalid link"
        subtitle="This password reset link is missing or malformed."
        backLink={{ label: "Back to sign in", href: "/login" }}
      >
        <div className="flex justify-center py-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#FEF2F2" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>
        <Link href="/forgot-password" className="block text-center text-[13px] text-[#2563EB] font-semibold hover:underline">
          Request a new reset link →
        </Link>
      </AuthCard>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError("");

    // Client-only check: passwords must match
    if (password !== confirm) {
      setConfirmError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      // Post-redirect toast — survives the page transition
      setRedirectToast({ type: "success", message: "Password updated successfully! Please sign in with your new password." });
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "INVALID_TOKEN") {
          toast.error("This reset link has expired or already been used.", {
            action: { label: "Get a new link", onClick: () => router.push("/forgot-password") },
          });
        } else {
          toast.fromApiError(err, "We couldn't reset your password. Please try again or request a new link.");
        }
      } else {
        toast.fromApiError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Set new password"
      subtitle="Choose a strong password with at least 12 characters."
      backLink={{ label: "Back to sign in", href: "/login" }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <PasswordInput
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 12 characters"
            autoComplete="new-password"
          />
          <PasswordStrengthBar score={passwordScore} />
        </div>

        <PasswordInput
          label="Confirm Password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setConfirmError(""); }}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={confirmError}
        />

        <AuthSubmitButton
          label="Reset password"
          loadingLabel="Resetting…"
          isLoading={loading}
          disabled={!password || !confirm}
        />
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={
        <AuthCard title="Loading…" subtitle="Just a moment.">
          <div className="flex justify-center py-4">
            <svg className="animate-spin w-8 h-8 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
          </div>
        </AuthCard>
      }>
        <ResetPasswordContent />
      </Suspense>
    </AuthPageShell>
  );
}
