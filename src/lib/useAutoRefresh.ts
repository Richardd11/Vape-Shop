"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps data fresh without a manual page reload.
 *
 * Runs the given callback:
 *  - once on mount (unless `immediate` is false) to reconcile with the server,
 *  - when the window regains focus,
 *  - when the tab becomes visible again,
 *  - on a polling interval (while the tab is visible).
 *
 * This is a reliable AJAX fallback that complements the instant Supabase
 * realtime / BroadcastChannel paths: even if those are unavailable or
 * misconfigured, the UI still reconciles with the server automatically.
 *
 * The callback is read through a ref, so passing an inline arrow is safe and
 * never re-subscribes the listeners.
 */
export function useAutoRefresh(
  onRefresh: () => void,
  options: { intervalMs?: number; enabled?: boolean; immediate?: boolean } = {}
) {
  const { intervalMs = 15000, enabled = true, immediate = true } = options;
  const cbRef = useRef(onRefresh);

  useEffect(() => {
    cbRef.current = onRefresh;
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const isVisible = () =>
      typeof document === "undefined" || document.visibilityState === "visible";
    const run = () => cbRef.current();
    const runIfVisible = () => {
      if (isVisible()) cbRef.current();
    };

    // Initial reconcile, scheduled async so it doesn't run during the effect's
    // synchronous body (and so it lands after the first paint).
    const initial = immediate ? setTimeout(run, 0) : null;

    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", runIfVisible);
    const id = intervalMs > 0 ? setInterval(runIfVisible, intervalMs) : null;

    return () => {
      if (initial) clearTimeout(initial);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", runIfVisible);
      if (id) clearInterval(id);
    };
  }, [enabled, intervalMs, immediate]);
}
