// ─── Toast type definitions ───────────────────────────────────────────────────
// Single source of truth. Add new types here — nothing else needs to change.

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;   // ms; 0 = persistent (must be manually dismissed)
  action?: ToastAction;
  createdAt: number;  // Date.now() — used for dedup window
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

// Default durations per type (ms)
export const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info:    5000,
  warning: 6000,
  error:   6000,
};

export const MAX_TOASTS = 4;
export const DEDUP_WINDOW_MS = 600; // ignore identical message+type within this window
