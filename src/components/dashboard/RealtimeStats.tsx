"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRealtimeSales, useRealtimeProducts } from "@/lib/realtime";
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
  const mountedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/reports/dashboard");
    if (res.ok) {
      const data = await res.json();
      setStats({
        todayRevenue: data.todayRevenue ?? 0,
        todayCount: data.todayCount ?? 0,
        monthRevenue: data.monthRevenue ?? 0,
        monthCount: data.monthCount ?? 0,
        lowStockCount: data.lowStockCount ?? 0,
        productCount: data.productCount ?? 0,
      });
    }
  }, []);

  useEffect(() => {
    if (mountedRef.current) {
      fetchStats();
    }
    mountedRef.current = true;
  }, [fetchStats]);

  useRealtimeSales(() => fetchStats());
  useRealtimeProducts(() => fetchStats());

  return null;
}
