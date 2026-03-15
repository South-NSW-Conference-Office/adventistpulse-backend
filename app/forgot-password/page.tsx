"use client";

import { useState } from "react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { useToast } from "@/contexts/ToastContext";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { usePublicRoute } from "@/lib/hooks/useRouteGuard";

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { toast } = useToast();
  const { isReady } = usePublicRoute();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      // Always show success — backend never reveals if email exists (timing-safe)
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        toast.warning("A reset link was recently sent. Check your inbox or try again shortly.");
      } else {
        toast.fromApiError(err, "Something went wrong — please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthPageShell>
        <AuthCard
          title="Check your inbox"
          subtitle="If that email is registered, a reset link is on its way."
          backLink={{ label: "Back to sign in", href: "/login" }}
        >
          <div className="flex justify-center py-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#EFF6FF" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>

          <p className="text-[13px] text-[#6B7280] text-center leading-relaxed">
            Check your spam folder if you don&apos;t see it within a few minutes.
          </p>

          <button
            type="button"
            onClick={() => { setSubmitted(false); setEmail(""); }}
            className="text-[13px] text-[#2563EB] font-semibold hover:underline text-center"
          >
            Try a different email
          </button>
        </AuthCard>
      </AuthPageShell>
    );
  }

  if (!isReady) return null;

  return (
    <AuthPageShell>
      <AuthCard
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a reset link."
        backLink={{ label: "Back to sign in", href: "/login" }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            icon={<MailIcon />}
          />

          <AuthSubmitButton
            label="Send reset link"
            loadingLabel="Sending…"
            isLoading={loading}
          />
        </form>
      </AuthCard>
    </AuthPageShell>
  );
}
