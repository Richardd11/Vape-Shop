import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString().split("T")[0];

  const [
    { data: todaySales },
    { data: monthSales },
    { data: lastMonthSales },
    { data: topProducts },
    { data: lowStock },
    { count: totalProducts },
    { data: recentSales },
  ] = await Promise.all([
    supabase.from("sales").select("total_amount, discount_amount")
      .eq("status", "completed").gte("created_at", `${todayStr}T00:00:00`),
    supabase.from("sales").select("total_amount, discount_amount")
      .eq("status", "completed").gte("created_at", monthStart),
    supabase.from("sales").select("total_amount")
      .eq("status", "completed")
      .gte("created_at", `${lastMonthStart}T00:00:00`)
      .lt("created_at", monthStart),
    supabase.from("sale_items")
      .select("product_id, product_name, quantity, line_total")
      .gte("created_at", monthStart)
      .order("quantity", { ascending: false })
      .limit(10),
    supabase.from("products_with_stock").select("id, name, total_stock, low_stock_alert, type")
      .eq("is_active", true),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("sales")
      .select("id, total_amount, payment_type, created_at, profiles(full_name)")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Low stock = at or below each product's own threshold (matches Inventory badge)
  const lowStockItems = (lowStock ?? []).filter(
    (p) => p.total_stock <= p.low_stock_alert
  );

  const todayRevenue = todaySales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const monthRevenue = monthSales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const lastMonthRevenue = lastMonthSales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;

  // Aggregate top products
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const item of topProducts ?? []) {
    const existing = productMap.get(item.product_id);
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += item.line_total;
    } else {
      productMap.set(item.product_id, {
        name: item.product_name,
        quantity: item.quantity,
        revenue: item.line_total,
      });
    }
  }
  const topProductsList = Array.from(productMap.entries())
    .map(([id, v]) => ({ product_id: id, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return NextResponse.json({
    today: { revenue: todayRevenue, transactions: todaySales?.length ?? 0 },
    month: { revenue: monthRevenue, transactions: monthSales?.length ?? 0 },
    last_month: { revenue: lastMonthRevenue, transactions: lastMonthSales?.length ?? 0 },
    growth: lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0,
    total_products: totalProducts ?? 0,
    low_stock_count: lowStockItems.length,
    top_products: topProductsList,
    low_stock_items: lowStockItems,
    recent_sales: recentSales ?? [],
  });
}
