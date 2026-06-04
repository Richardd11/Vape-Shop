"use client";

import { useEffect, useRef } from "react";

export type RefreshChannel = "products" | "sales" | "dashboard" | "inventory";

const channel = typeof window !== "undefined" ? new BroadcastChannel("__pos_refresh__") : null;

export function notify(channel: RefreshChannel) {
  const bc = typeof window !== "undefined" ? new BroadcastChannel("__pos_refresh__") : null;
  bc?.postMessage({ channel, ts: Date.now() });
  bc?.close();
}

export function useRefreshListener(
  refreshChannel: RefreshChannel,
  onRefresh: () => void,
  enabled = true
) {
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    if (!enabled || !channel) return;

    const handler = (e: MessageEvent<{ channel: RefreshChannel }>) => {
      if (e.data.channel === refreshChannel) {
        cbRef.current();
      }
    };

    channel.addEventListener("message", handler);
    return () => channel.removeEventListener("message", handler);
  }, [refreshChannel, enabled]);
}
