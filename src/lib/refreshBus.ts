"use client";

import { useEffect, useRef } from "react";

export type RefreshChannel = "products" | "sales" | "dashboard" | "inventory";

const CHANNEL_NAME = "__pos_refresh__";

// Dedicated channel for *listening*. A BroadcastChannel never receives the
// messages it itself posts, so we use a separate sender instance below.
const listenChannel =
  typeof window !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;

// Long-lived sender. Creating a fresh channel and closing it synchronously
// after postMessage can drop the message before delivery, so we keep one open.
let sendChannel: BroadcastChannel | null = null;
function getSender(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!sendChannel) sendChannel = new BroadcastChannel(CHANNEL_NAME);
  return sendChannel;
}

export function notify(channel: RefreshChannel) {
  getSender()?.postMessage({ channel, ts: Date.now() });
}

export function useRefreshListener(
  refreshChannel: RefreshChannel,
  onRefresh: () => void,
  enabled = true
) {
  const cbRef = useRef(onRefresh);

  useEffect(() => {
    cbRef.current = onRefresh;
  });

  useEffect(() => {
    if (!enabled || !listenChannel) return;

    const handler = (e: MessageEvent<{ channel: RefreshChannel }>) => {
      if (e.data.channel === refreshChannel) {
        cbRef.current();
      }
    };

    listenChannel.addEventListener("message", handler);
    return () => listenChannel.removeEventListener("message", handler);
  }, [refreshChannel, enabled]);
}
