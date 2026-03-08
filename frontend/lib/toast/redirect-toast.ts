/**
 * One-shot post-redirect toast store (sessionStorage).
 *
 * Problem: toast state is in-memory. When a successful action redirects
 * the user to a new page (e.g. password reset → login), the toast fires
 * client-side before the navigation completes, then disappears with the
 * component tree.
 *
 * Solution: stash the toast in sessionStorage before navigating.
 * On the destination page mount, read + delete it, then fire the toast.
 * sessionStorage is tab-scoped so it doesn't leak across tabs.
 */

import type { ToastType } from "./types";

const KEY = "pulse:redirect_toast";

export interface RedirectToast {
  type: ToastType;
  message: string;
}

export function setRedirectToast(toast: RedirectToast): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(toast));
  } catch {
    // sessionStorage unavailable (private browsing restrictions etc.) — silently skip
  }
}

export function consumeRedirectToast(): RedirectToast | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY); // one-shot — always delete after reading
    return JSON.parse(raw) as RedirectToast;
  } catch {
    return null;
  }
}
