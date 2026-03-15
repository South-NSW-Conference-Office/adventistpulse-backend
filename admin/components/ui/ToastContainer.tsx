"use client";

/**
 * ToastContainer — mounted ONCE in root layout.tsx (above all route changes).
 * Pure rendering: receives state from ToastContext, renders ToastItem stack.
 * No logic lives here.
 */

import { useToast } from "@/contexts/ToastContext";
import ToastItem from "./ToastItem";

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
