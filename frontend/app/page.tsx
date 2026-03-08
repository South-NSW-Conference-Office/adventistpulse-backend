"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import WaterBackground from "./components/WaterBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { consumeRedirectToast } from "@/lib/toast/redirect-toast";

/* ─── Inline SVG Icons ─── */

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#999"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a1a1a">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
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

/* ─── Adventist Pulse Logo ─── */

function APLogo() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Image
        src="/adventist-logo.png"
        alt="Adventist Pulse"
        width={48}
        height={48}
        priority
      />
      <span className="text-[22px] font-bold text-[#1a1a1a] tracking-tight">
        Adventist Pulse
      </span>
    </div>
  );
}

/* ─── 3D-style "AP" for right panel ─── */

/* ─── Main Login Page ─── */

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Consume any post-redirect toast (e.g. "Password updated" from reset-password page)
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
        toast.warning("For your security, please update your password before continuing.", {
          action: { label: "Update password", onClick: () => router.push("/change-password") },
        });
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
        router.push("/dashboard");
      }
    } catch (err) {
      toast.fromApiError(err, "Sign-in failed. Please check your details and try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "transparent", position: "relative" }}
    >
      <WaterBackground />

      {/* ── Centered Login Card ── */}
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
        {/* Logo */}
        <APLogo />

        <div className="mt-10" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-[#1a1a1a]">
              Email Address
            </label>
            <div
              className="flex items-center gap-3 px-4"
              style={{
                background: "#f7f7f7",
                border: "1px solid #e0e0e0",
                borderRadius: 12,
                height: 50,
              }}
            >
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

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-semibold text-[#1a1a1a]">
              Password
            </label>
            <div
              className="flex items-center gap-3 px-4"
              style={{
                background: "#f7f7f7",
                border: "1px solid #e0e0e0",
                borderRadius: 12,
                height: 50,
              }}
            >
              <LockIcon />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[14px] text-[#1a1a1a] placeholder-[#aaa]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[#aaa] hover:text-[#555] transition-colors shrink-0"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 cursor-pointer accent-[#1a1a1a]"
              />
              <label
                htmlFor="remember"
                className="text-[13px] text-[#333] cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>
            <a href="/forgot-password" className="text-[13px] text-[#555] hover:underline">
              Forgot Password
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white text-[15px] font-semibold transition-opacity hover:opacity-80 active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "#111111",
              borderRadius: 30,
              height: 50,
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Links */}
        <div className="mt-5 text-center">
          <p className="text-[13px] text-[#999]">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-[#1a1a1a] font-semibold hover:underline">
              Create one
            </a>
          </p>
        </div>


      </div>
    </div>
  );
}
