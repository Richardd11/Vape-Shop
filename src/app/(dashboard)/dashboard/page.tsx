import { createClient } from "@/lib/supabase/server";
import RealtimeDashboard from "@/components/dashboard/RealtimeDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { data: todaySales },
    { data: monthSales },
    { data: lowStockProducts },
    { data: recentSales },
    { count: totalProductsCount },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", `${todayStr}T00:00:00`)
      .lte("created_at", `${todayStr}T23:59:59`),
    supabase
      .from("sales")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", monthStart),
    supabase
      .from("products_with_stock")
      .select("*")
      .lt("total_stock", 5)
      .eq("is_active", true)
      .order("total_stock", { ascending: true })
      .limit(5),
    supabase
      .from("sales")
      .select("id, total_amount, payment_type, created_at, profiles(full_name)")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const todayRevenue = todaySales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const todayCount = todaySales?.length ?? 0;
  const monthRevenue = monthSales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const monthCount = monthSales?.length ?? 0;

  return (
    <RealtimeDashboard
      initialData={{
        todayRevenue,
        todayCount,
        monthRevenue,
        monthCount,
        lowStockProducts: lowStockProducts ?? [],
        topProducts: [],
        recentSales: recentSales ?? [],
        productCount: totalProductsCount ?? 0,
      }}
    />
  );
}
