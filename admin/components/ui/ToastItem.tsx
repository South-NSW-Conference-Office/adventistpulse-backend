"use client";

import { useEffect, useRef, useState } from "react";
import { Toast, ToastType } from "@/lib/toast/types";

// ─── Config ───────────────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bar: string; icon: string; label: string }> = {
  success: { bar: "#16A34A", icon: "✓", label: "Success" },
  error:   { bar: "#DC2626", icon: "✕", label: "Error"   },
  warning: { bar: "#F59E0B", icon: "!", label: "Warning"  },
  info:    { bar: "#2563EB", icon: "i", label: "Info"     },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export default function ToastItem({ toast, onDismiss }: Props) {
  const { id, type, message, duration, action } = toast;
  const style = STYLES[type];

  // Progress bar width: 100 → 0 over `duration` ms
  const [progress, setProgress] = useState(100);
  const timerRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const rafRef    = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const startRef  = useRef<number>(Date.now());
  const dismissed = useRef(false);

  const handleDismiss = () => {
    if (dismissed.current) return; // guard against double-dismiss race
    dismissed.current = true;
    if (timerRef.current)  clearTimeout(timerRef.current);
    if (rafRef.current)    cancelAnimationFrame(rafRef.current);
    onDismiss(id);
  };

  useEffect(() => {
    if (duration === 0) return; // persistent — no auto-dismiss

    startRef.current = Date.now();

    // Smooth progress bar via rAF
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    // Auto-dismiss
    timerRef.current = setTimeout(handleDismiss, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Truncate long messages at 140 chars
  const displayMessage =
    message.length > 140 ? message.slice(0, 137) + "…" : message;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="relative flex items-start gap-3 w-full max-w-sm bg-[#0F0F0F] rounded-xl shadow-2xl overflow-hidden px-4 py-3.5 animate-toast-in"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ background: style.bar }}
      />

      {/* Icon */}
      <div
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black mt-0.5"
        style={{ background: style.bar, color: "#fff" }}
        aria-label={style.label}
      >
        {style.icon}
      </div>

      {/* Message + action */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-white leading-snug font-medium break-words">
          {displayMessage}
        </p>
        {action && (
          <button
            onClick={() => { action.onClick(); handleDismiss(); }}
            className="mt-1.5 text-[12px] font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: style.bar }}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 text-white/30 hover:text-white/80 transition-colors text-[18px] leading-none mt-0.5"
      >
        ×
      </button>

      {/* Progress bar */}
      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-[2px] transition-none"
          style={{ width: `${progress}%`, background: style.bar, opacity: 0.5 }}
        />
      )}
    </div>
  );
}
