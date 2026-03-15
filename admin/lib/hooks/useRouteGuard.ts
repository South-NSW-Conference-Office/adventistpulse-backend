"use client";

/**
 * useRouteGuard — auth-aware routing hooks.
 *
 * usePublicRoute()  — for pages that should NOT be accessible when logged in
 *                     (login, register, forgot-password, reset-password).
 *                     Redirects authenticated users to /dashboard.
 *
 * usePrivateRoute() — for pages that require authentication.
 *                     Redirects unauthenticated users to /.
 *                     (DashboardLayout already does this manually — this hook
 *                     is available for pages that don't have a layout guard.)
 *
 * Both return { isReady } — renders should gate on isReady to avoid flashing.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ─── Public Route (auth pages only) ──────────────────────────────────────────

/**
 * Redirects an already-authenticated user away from public auth pages.
 * Returns isReady=false while the session is being restored.
 */
export function usePublicRoute(redirectTo = "/dashboard") {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user && accessToken) {
      router.replace(redirectTo);
    }
  }, [user, accessToken, isLoading, router, redirectTo]);

  // isReady: safe to render the page
  const isReady = !isLoading && !(user && accessToken);
  return { isReady, isLoading };
}

// ─── Private Route ────────────────────────────────────────────────────────────

/**
 * Redirects an unauthenticated user to the login page.
 * Returns isReady=false while the session is being restored.
 */
export function usePrivateRoute(redirectTo = "/") {
  const { user, accessToken, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || !accessToken) {
      router.replace(redirectTo);
    }
  }, [user, accessToken, isLoading, router, redirectTo]);

  const isReady = !isLoading && !!(user && accessToken);
  return { isReady, isLoading };
}
