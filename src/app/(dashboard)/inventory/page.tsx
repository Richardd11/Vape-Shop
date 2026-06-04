import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import RealtimeInventoryList from "@/components/inventory/RealtimeInventoryList";

export const dynamic = "force-dynamic";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  const isAdmin = profile?.role === "admin";

  let query = supabase
    .from("products_with_stock")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }
  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  const { data: products } = await query;

  return (
    <Suspense fallback={
      <div className="flex flex-col gap-5 animate-fade-in pb-24 md:pb-0">
        <div className="skeleton h-12 w-64" />
        <div className="card p-3"><div className="skeleton h-10 w-full" /></div>
        <div className="card p-6"><div className="skeleton h-96 w-full" /></div>
      </div>
    }>
      <RealtimeInventoryList
        initialProducts={products ?? []}
        isAdmin={isAdmin}
      />
    </Suspense>
  );
}
