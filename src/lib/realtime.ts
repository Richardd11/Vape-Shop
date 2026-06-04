"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type RealtimeTable =
  | "sales"
  | "sale_items"
  | "products"
  | "product_variants"
  | "inventory_movements";

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

type RealtimeCallback<T extends Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void;

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  table: RealtimeTable,
  options: {
    event?: RealtimeEvent;
    filter?: string;
    enabled?: boolean;
  } = {}
): { status: string } {
  const { event = "*", filter, enabled = true } = options;
  const [status, setStatus] = useState("DISCONNECTED");
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channelName = `realtime:${table}:${event}:${filter || "all"}`;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel.on(
      "postgres_changes" as never,
      {
        event,
        schema: "public",
        table,
        filter,
      } as never,
      () => {
        setStatus("CONNECTED");
      }
    );

    channel.subscribe((subStatus: string) => {
      setStatus(subStatus);
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, enabled]);

  return { status };
}

export function useRealtimeListener<T extends Record<string, unknown>>(
  table: RealtimeTable,
  callback: RealtimeCallback<T>,
  options: {
    event?: RealtimeEvent;
    filter?: string;
    enabled?: boolean;
  } = {}
) {
  const { event = "*", filter, enabled = true } = options;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channelName = `realtime:${table}:${event}:${filter || "all"}:${Date.now()}`;

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    channel.on(
      "postgres_changes" as never,
      {
        event,
        schema: "public",
        table,
        filter,
      } as never,
      (payload: RealtimePostgresChangesPayload<T>) => {
        callbackRef.current(payload);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, enabled]);
}

export function useRealtimeProducts(
  onUpdate: () => void,
  enabled = true
) {
  useRealtimeListener(
    "products",
    () => onUpdate(),
    { event: "*", enabled }
  );
  useRealtimeListener(
    "product_variants",
    () => onUpdate(),
    { event: "*", enabled }
  );
  useRealtimeListener(
    "inventory_movements",
    () => onUpdate(),
    { event: "*", enabled }
  );
}

export function useRealtimeSales(
  onUpdate: () => void,
  enabled = true
) {
  useRealtimeListener(
    "sales",
    () => onUpdate(),
    { event: "*", enabled }
  );
  useRealtimeListener(
    "sale_items",
    () => onUpdate(),
    { event: "*", enabled }
  );
}
