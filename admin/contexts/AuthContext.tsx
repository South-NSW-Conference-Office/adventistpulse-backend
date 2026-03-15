"use client";

/**
 * AuthContext — session state management.
 * Keeps accessToken in memory only (never localStorage).
 * Refresh token lives in the httpOnly cookie managed by the backend.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  User,
} from "@/lib/api/auth";

const PENDING_EMAIL_KEY = "pulse:pending_email";
import { ApiError } from "@/lib/api/client";
import { useToast } from "@/contexts/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login:    (email: string, password: string, rememberMe?: boolean) => Promise<{ mustChangePassword: boolean; emailVerified: boolean; accountStatus: string }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
  refreshSession: (silent?: boolean) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true, // start true so we attempt silent restore before rendering
    error: null,
  });

  const { toast } = useToast();

  // Prevent double-invocation in StrictMode from firing two refresh calls
  const didRestoreRef = useRef(false);
  // Track whether user was previously authenticated — determines if expiry is a surprise
  const wasAuthenticatedRef = useRef(false);

  const refreshSession = useCallback(async (silent = false) => {
    try {
      const { accessToken } = await refreshToken();
      const { getMe } = await import("@/lib/api/auth");
      const user = await getMe(accessToken);
      wasAuthenticatedRef.current = true;
      setState({ user, accessToken, isLoading: false, error: null });
    } catch {
      // If the user had an active session and it expired — tell them
      if (wasAuthenticatedRef.current && !silent) {
        toast.warning("Your session expired — please sign in again.");
      }
      wasAuthenticatedRef.current = false;
      setState({ user: null, accessToken: null, isLoading: false, error: null });
    }
  }, [toast]);

  // Silent session restore on mount — always silent (no toast on initial load)
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;
    refreshSession(true);
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { accessToken, user, mustChangePassword } = await loginUser(email, password, rememberMe);

      if (!user.emailVerified) {
        // Email not verified — revoke session, redirect to pending-verification
        try { await logoutUser(accessToken); } catch { /* best-effort */ }
        sessionStorage.setItem(PENDING_EMAIL_KEY, user.email);
        setState((prev) => ({ ...prev, isLoading: false }));
        return { mustChangePassword: false, emailVerified: false, accountStatus: user.accountStatus ?? 'pending_onboarding' };
      }

      wasAuthenticatedRef.current = true;
      setState({ user, accessToken, isLoading: false, error: null });
      return { mustChangePassword, emailVerified: true, accountStatus: user.accountStatus ?? 'approved' };
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const { accessToken } = state;
    setState({ user: null, accessToken: null, isLoading: false, error: null });
    if (accessToken) {
      try {
        await logoutUser(accessToken);
      } catch {
        // Best-effort — local state is already cleared
      }
    }
  }, [state]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Backend creates the account and returns a session — we immediately
      // revoke it. Identity is only established after email verification + login.
      const { accessToken } = await registerUser(name, email, password);
      try { await logoutUser(accessToken); } catch { /* best-effort */ }

      // Store email in sessionStorage so pending-verification page can display
      // it and use it for resend — no auth state needed.
      sessionStorage.setItem(PENDING_EMAIL_KEY, email);

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw err;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
