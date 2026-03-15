"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import WaterBackground from "@/app/components/WaterBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { consumeRedirectToast } from "@/lib/toast/redirect-toast";
import { usePublicRoute } from "@/lib/hooks/useRouteGuard";

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function APLogo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Image src="/adventist-logo.png" alt="Adventist Pulse" width={48} height={48} priority />
      <span className="text-[22px] font-bold text-[#1a1a1a] tracking-tight">Adventist Pulse</span>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { isReady } = usePublicRoute();

  useEffect(() => {
    const pending = consumeRedirectToast();
    if (pending) toast[pending.type](pending.message);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { mustChangePassword, emailVerified, accountStatus } = await login(email, password, remember);

      if (!emailVerified) {
        toast.warning("Your email address isn't verified yet. We've sent a new verification link — check your inbox.");
        router.push("/pending-verification");
      } else if (mustChangePassword) {
        router.push("/change-password");
      } else if (accountStatus === "pending_onboarding") {
        router.push("/onboarding");
      } else if (accountStatus === "pending_approval") {
        router.push("/pending-approval");
      } else if (accountStatus === "rejected") {
        toast.error("Your account application was not approved. You may update your details and reapply.");
        router.push("/onboarding");
      } else {
        toast.success("Welcome back! You're now signed in.");
        router.push("/");
      }
    } catch (err) {
      toast.fromApiError(err, "Sign-in failed. Please check your details and try again.");
    }
  };

  if (!isReady) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ position: "relative" }}>
      <WaterBackground />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 460,
          background: "rgba(255,255,255,0.38)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          borderRadius: 28,
          boxShadow: "0 8px 48px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.55)",
          padding: "48px 44px 40px",
        }}
      >
        <APLogo />
        <div className="mt-10" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-[#1a1a1a]">Email Address</label>
            <div className="flex items-center gap-3 px-4" style={{ background: "#f7f7f7", border: "1px solid #e0e0e0", borderRadius: 12, height: 50 }}>
              <MailIcon />
              <input
                type="email"
                placeholder="johndoe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[14px] text-[#1a1a1a] placeholder-[#aaa]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-[#1a1a1a]">Password</label>
            <div className="flex items-center gap-3 px-4" style={{ background: "#f7f7f7", border: "1px solid #e0e0e0", borderRadius: 12, height: 50 }}>
              <LockIcon />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[14px] text-[#1a1a1a] placeholder-[#aaa]"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[#aaa] hover:text-[#555] transition-colors shrink-0" tabIndex={-1}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input id="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 cursor-pointer accent-[#1a1a1a]" />
              <label htmlFor="remember" className="text-[13px] text-[#333] cursor-pointer select-none">Remember me</label>
            </div>
            <a href="/forgot-password" className="text-[13px] text-[#555] hover:underline">Forgot Password</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white text-[15px] font-semibold transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#111111", borderRadius: 30, height: 50, border: "none", cursor: isLoading ? "not-allowed" : "pointer" }}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[13px] text-[#999]">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-[#1a1a1a] font-semibold hover:underline">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
}
