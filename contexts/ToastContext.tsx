"use client";

/**
 * ToastContext — single source of truth for all toast notifications.
 *
 * Architecture:
 *  - useReducer owns state (pure, testable, no side-effects in reducer)
 *  - useToast() hook is the ONLY consumption API
 *  - ToastContainer (mounted once in root layout) is the ONLY render point
 *  - No component ever renders toast UI directly
 */

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import {
  Toast,
  ToastOptions,
  ToastType,
  TOAST_DURATIONS,
  MAX_TOASTS,
  DEDUP_WINDOW_MS,
} from "@/lib/toast/types";
import { ApiError } from "@/lib/api/client";

// ─── State & Reducer ──────────────────────────────────────────────────────────

type AddAction     = { type: "ADD";     toast: Toast };
type DismissAction = { type: "DISMISS"; id: string  };
type Action = AddAction | DismissAction;

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case "ADD": {
      // Dedup: ignore if identical message+type within DEDUP_WINDOW_MS
      const isDuplicate = state.some(
        (t) =>
          t.type === action.toast.type &&
          t.message === action.toast.message &&
          action.toast.createdAt - t.createdAt < DEDUP_WINDOW_MS
      );
      if (isDuplicate) return state;

      // Enforce max — drop the oldest if at capacity
      const trimmed =
        state.length >= MAX_TOASTS ? state.slice(state.length - MAX_TOASTS + 1) : state;

      return [...trimmed, action.toast];
    }

    case "DISMISS":
      // No-op if already gone — prevents double-dismiss flicker
      return state.filter((t) => t.id !== action.id);

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: Toast[];
  dismiss: (id: string) => void;
  toast: {
    success: (message: string, options?: ToastOptions) => void;
    error:   (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info:    (message: string, options?: ToastOptions) => void;
    /** Convenience: maps ApiError status/code to the right toast type automatically */
    fromApiError: (err: unknown, fallback?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "DISMISS", id });
  }, []);

  const add = useCallback(
    (type: ToastType, message: string, options?: ToastOptions) => {
      const duration = options?.duration ?? TOAST_DURATIONS[type];
      dispatch({
        type: "ADD",
        toast: {
          id:        crypto.randomUUID(),
          type,
          message,
          duration,
          action:    options?.action,
          createdAt: Date.now(),
        },
      });
    },
    []
  );

  const fromApiError = useCallback(
    (err: unknown, fallback = "Something went wrong. Please try again.") => {
      if (err instanceof ApiError) {

        // ── Network & connectivity ─────────────────────────────────────────
        if (err.status === 0 || err.code === "NETWORK_ERROR") {
          add("error", "Unable to reach the server. Check your internet connection and try again.");
          return;
        }

        // ── Rate limiting ──────────────────────────────────────────────────
        if (err.status === 429 && !err.code) {
          add("warning", "You've made too many requests. Please wait a moment before trying again.");
          return;
        }

        // ── Auth-specific codes ────────────────────────────────────────────
        switch (err.code) {
          case "INVALID_CREDENTIALS":
            add("error", "Incorrect email or password. Please check your details and try again.");
            return;

          case "ACCOUNT_LOCKED":
            // Backend includes minutes remaining in message — use it
            add("warning", err.message || "Your account is temporarily locked due to too many failed sign-in attempts. Please try again later.");
            return;

          case "ACCOUNT_DEACTIVATED":
            add("error", "This account has been deactivated. Please contact support if you think this is a mistake.");
            return;

          case "EMAIL_NOT_VERIFIED":
            add("warning", "Please verify your email address before signing in. Check your inbox for the verification link.");
            return;

          case "EMAIL_TAKEN":
            add("error", "An account with this email address already exists. Try signing in instead.");
            return;

          case "INVALID_TOKEN":
            add("error", "This link has expired or is no longer valid. Please request a new one.");
            return;

          case "ALREADY_VERIFIED":
            add("info", "Your email address is already verified. You can sign in normally.");
            return;

          case "OAUTH_ONLY":
            add("info", "This account uses social sign-in. Password reset isn't available — try signing in with your linked account.");
            return;

          case "TOKEN_REVOKED":
            add("warning", "Your session has ended. Please sign in again to continue.");
            return;

          case "VALIDATION_ERROR":
            // Backend returns specific field messages — show them
            add("error", err.message || "Please check your details and try again.");
            return;

          case "RESEND_COOLDOWN":
            add("warning", err.message || "A verification email was recently sent. Please wait a minute before requesting another.");
            return;

          case "RESET_RATE_LIMIT":
          case "RESET_RATE_LIMITED":
            add("warning", "A password reset email was recently sent to this address. Check your inbox or wait a little before trying again.");
            return;
        }

        // ── HTTP status fallbacks (no specific code) ───────────────────────
        if (err.status === 401) {
          add("warning", "Your session has expired. Please sign in again.");
          return;
        }
        if (err.status === 403) {
          add("error", "You don't have permission to do that.");
          return;
        }
        if (err.status >= 500) {
          add("error", "Something went wrong on our end. Please try again in a moment.");
          return;
        }

        // ── Final fallback — use backend message if readable, else generic ─
        const msg = err.message && err.message.length < 120 ? err.message : fallback;
        add("error", msg);
        return;
      }

      // Unknown non-API error
      add("error", fallback);
    },
    [add]
  );

  const toast = {
    success: (msg: string, opts?: ToastOptions) => add("success", msg, opts),
    error:   (msg: string, opts?: ToastOptions) => add("error",   msg, opts),
    warning: (msg: string, opts?: ToastOptions) => add("warning", msg, opts),
    info:    (msg: string, opts?: ToastOptions) => add("info",    msg, opts),
    fromApiError,
  };

  return (
    <ToastContext.Provider value={{ toasts, dismiss, toast }}>
      {children}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a <ToastProvider>");
  return ctx;
}
