"use client";

import { useState, useCallback } from "react";
import { useRealtimeSales, useRealtimeProducts } from "@/lib/realtime";
import { useRefreshListener } from "@/lib/refreshBus";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RealtimeStats({
  initialTodayRevenue,
  initialTodayCount,
  initialMonthRevenue,
  initialMonthCount,
  initialLowStockCount,
  initialProductCount,
}: {
  initialTodayRevenue: number;
  initialTodayCount: number;
  initialMonthRevenue: number;
  initialMonthCount: number;
  initialLowStockCount: number;
  initialProductCount: number;
}) {
  const [stats, setStats] = useState({
    todayRevenue: initialTodayRevenue,
    todayCount: initialTodayCount,
    monthRevenue: initialMonthRevenue,
    monthCount: initialMonthCount,
    lowStockCount: initialLowStockCount,
    productCount: initialProductCount,
  });

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/reports/dashboard", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setStats({
        todayRevenue: data.today?.revenue ?? 0,
        todayCount: data.today?.transactions ?? 0,
        monthRevenue: data.month?.revenue ?? 0,
        monthCount: data.month?.transactions ?? 0,
        lowStockCount: data.low_stock_count ?? 0,
        productCount: data.total_products ?? 0,
      });
    }
  }, []);

  useRealtimeSales(() => fetchStats());
  useRealtimeProducts(() => fetchStats());
  useRefreshListener("dashboard", fetchStats);
  useAutoRefresh(fetchStats);

  return null;
}
