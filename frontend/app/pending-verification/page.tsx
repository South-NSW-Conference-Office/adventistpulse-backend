"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthCard from "@/components/auth/AuthCard";
import { useToast } from "@/contexts/ToastContext";
import { resendVerificationByEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const PENDING_EMAIL_KEY  = "pulse:pending_email";
const COOLDOWN_SECONDS   = 60;

export default function PendingVerificationPage() {
  const { toast }   = useToast();
  const router      = useRouter();

  const [email,    setEmail]    = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sending,  setSending]  = useState(false);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read email from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(PENDING_EMAIL_KEY);
    if (stored) {
      setEmail(stored);
    }
  }, []);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleResend = async () => {
    if (!email || sending || cooldown > 0) return;
    setSending(true);
    try {
      await resendVerificationByEmail(email);
      // Always treat as success — endpoint never reveals account status
      toast.success("Verification email sent! Check your inbox — it may take a minute or two to arrive.");
      startCooldown();
    } catch (err) {
      if (err instanceof ApiError && err.code === "RESEND_COOLDOWN") {
        toast.warning(err.message || "Please wait a moment before requesting another email. Check your spam folder in the meantime.");
        startCooldown();
      } else {
        toast.fromApiError(err, "Unable to send email right now. Please try again shortly.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleWrongEmail = () => {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    router.replace("/");
  };

  return (
    <AuthPageShell>
      <AuthCard
        title="Check your inbox"
        subtitle={
          email
            ? `We sent a verification link to ${email}`
            : "We sent a verification link to your email address."
        }
      >
        {/* Envelope illustration */}
        <div className="flex justify-center py-2">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "#F0FDF4" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-center">
          <p className="text-[13px] text-[#6B7280]">
            Click the link in the email to verify your account.
            The link expires in <strong className="text-[#111]">24 hours</strong>.
          </p>
          <p className="text-[12px] text-[#9CA3AF]">
            Can&apos;t find it? Check your spam or junk folder.
          </p>
        </div>

        {/* Resend button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={!email || sending || cooldown > 0}
          className="w-full font-semibold text-[14px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:   cooldown > 0 ? "#F3F4F6" : "#111111",
            color:        cooldown > 0 ? "#6B7280" : "#ffffff",
            borderRadius: 30,
            height:       50,
            border:       "none",
            cursor:       (cooldown > 0 || !email) ? "not-allowed" : "pointer",
          }}
        >
          {sending
            ? "Sending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification email"}
        </button>

        <p className="text-[12px] text-[#9CA3AF] text-center">
          Wrong email?{" "}
          <button
            type="button"
            onClick={handleWrongEmail}
            className="text-[#1a1a1a] font-semibold hover:underline"
          >
            Go back to sign in
          </button>
        </p>
      </AuthCard>
    </AuthPageShell>
  );
}
