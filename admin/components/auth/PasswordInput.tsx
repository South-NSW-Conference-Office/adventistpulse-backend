"use client";

/**
 * PasswordInput — AuthInput with eye visibility toggle.
 * Extracted from login page. Single responsibility: password field only.
 */
import { useState } from "react";
import AuthInput from "./AuthInput";

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

interface Props {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}

export default function PasswordInput({
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  error,
  autoComplete = "current-password",
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">
        {label}
      </label>
      <div
        className="flex items-center gap-3 px-4 transition-shadow"
        style={{
          background:   "#f7f7f7",
          border:       `1px solid ${error ? "#FCA5A5" : "#e0e0e0"}`,
          borderRadius: 12,
          height:       50,
        }}
      >
        <span className="text-[#aaa] shrink-0"><LockIcon /></span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent outline-none text-[14px] text-[#1a1a1a] placeholder-[#aaa]"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="text-[#aaa] hover:text-[#555] transition-colors shrink-0"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-500 leading-snug">{error}</p>
      )}
    </div>
  );
}
