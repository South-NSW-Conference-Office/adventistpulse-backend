"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthPageShell from "@/components/auth/AuthPageShell";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import PasswordInput from "@/components/auth/PasswordInput";
import PasswordStrengthBar, { calcPasswordScore } from "@/components/auth/PasswordStrengthBar";
import AuthSubmitButton from "@/components/auth/AuthSubmitButton";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicRoute } from "@/lib/hooks/useRouteGuard";
import { useToast } from "@/contexts/ToastContext";

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export default function RegisterPage() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");

  const { register, isLoading } = useAuth();
  const { isReady } = usePublicRoute();
  const { toast }               = useToast();
  const router                  = useRouter();

  const passwordScore = calcPasswordScore(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      router.push("/pending-verification");
    } catch (err) {
      toast.fromApiError(err, "We couldn't create your account. Please check your details and try again.");
    }
  };

  if (!isReady) return null;

  return (
    <AuthPageShell>
      <AuthCard
        title="Create account"
        subtitle="Join Adventist Pulse to access church health analytics."
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            label="Full Name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            icon={<PersonIcon />}
          />

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

          <div>
            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 12 characters"
              autoComplete="new-password"
            />
            <PasswordStrengthBar score={passwordScore} />
          </div>

          <p className="text-[11px] text-[#9CA3AF] -mt-1">
            Must be at least 12 characters with a mix of letters, numbers, and symbols.
          </p>

          <AuthSubmitButton
            label="Create account"
            loadingLabel="Creating account…"
            isLoading={isLoading}
          />
        </form>

        <p className="text-[13px] text-[#999] text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-[#1a1a1a] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthPageShell>
  );
}
