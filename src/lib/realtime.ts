"use client";

import { useEffect, useRef } from "react";
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

// Debounce helper: coalesces rapid calls into one
function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  };
  return debounced as unknown as T;
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

function useDebouncedCallback(callback: () => void, ms: number): () => void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const debouncedRef = useRef<(() => void) | null>(null);

  if (!debouncedRef.current) {
    debouncedRef.current = debounce(() => callbackRef.current(), ms);
  }

  return debouncedRef.current;
}

export function useRealtimeProducts(
  onUpdate: () => void,
  enabled = true
) {
  const refresh = useDebouncedCallback(onUpdate, 300);

  useRealtimeListener("products", () => refresh(), { event: "*", enabled });
  useRealtimeListener("product_variants", () => refresh(), { event: "*", enabled });
  useRealtimeListener("inventory_movements", () => refresh(), { event: "*", enabled });
}

export function useRealtimeSales(
  onUpdate: () => void,
  enabled = true
) {
  const refresh = useDebouncedCallback(onUpdate, 300);

  useRealtimeListener("sales", () => refresh(), { event: "*", enabled });
  useRealtimeListener("sale_items", () => refresh(), { event: "*", enabled });
}


