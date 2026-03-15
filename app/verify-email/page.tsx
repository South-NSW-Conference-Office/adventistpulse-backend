"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthCard from "@/components/auth/AuthCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { verifyEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { setRedirectToast } from "@/lib/toast/redirect-toast";
import Link from "next/link";

type VerifyState = "loading" | "success" | "error" | "no-token";

function VerifyEmailContent() {
  const params        = useSearchParams();
  const { accessToken } = useAuth();
  const { toast }     = useToast();
  const router        = useRouter();
  const didVerify     = useRef(false);

  const [state, setState]   = useState<VerifyState>("loading");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    if (didVerify.current) return;
    didVerify.current = true;

    const token = params.get("token");

    if (!token) {
      setState("no-token");
      return;
    }

    verifyEmail(token)
      .then(() => {
        // Clean up the pending email from sessionStorage — flow is complete
        sessionStorage.removeItem("pulse:pending_email");
        setState("success");
        setRedirectToast({ type: "success", message: "Email verified! Please sign in to continue." });
        setTimeout(() => router.replace("/"), 1800);
      })
      .catch((err) => {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Verification failed — please try again.";
        setErrMsg(msg);
        setState("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "loading") {
    return (
      <AuthCard title="Verifying your email…" subtitle="Just a moment.">
        <div className="flex justify-center py-4">
          <svg className="animate-spin w-8 h-8 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
          </svg>
        </div>
      </AuthCard>
    );
  }

  if (state === "success") {
    return (
      <AuthCard title="Email verified!" subtitle="Taking you to the sign-in page…">
        <div className="flex justify-center py-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#F0FDF4" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (state === "no-token") {
    return (
      <AuthCard title="Invalid link" subtitle="This verification link is missing or malformed." backLink={{ label: "Back to sign in", href: "/login" }}>
        <div className="flex justify-center py-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#FFF7ED" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        </div>
        {accessToken && (
          <Link href="/pending-verification" className="block text-center text-[13px] text-[#2563EB] font-semibold hover:underline">
            Request a new verification email →
          </Link>
        )}
      </AuthCard>
    );
  }

  // error state
  return (
    <AuthCard title="Link expired" subtitle={errMsg || "This link has expired or has already been used."} backLink={{ label: "Back to sign in", href: "/login" }}>
      <div className="flex justify-center py-2">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#FEF2F2" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
      </div>
      {accessToken ? (
        <Link href="/pending-verification" className="block text-center text-[13px] text-[#2563EB] font-semibold hover:underline">
          Request a new verification email →
        </Link>
      ) : (
        <Link href="/forgot-password" className="block text-center text-[13px] text-[#2563EB] font-semibold hover:underline">
          Go to forgot password →
        </Link>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={
        <AuthCard title="Verifying…" subtitle="Just a moment.">
          <div className="flex justify-center py-4">
            <svg className="animate-spin w-8 h-8 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
          </div>
        </AuthCard>
      }>
        <VerifyEmailContent />
      </Suspense>
    </AuthPageShell>
  );
}
