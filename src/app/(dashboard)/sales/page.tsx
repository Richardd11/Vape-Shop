import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import RealtimeSalesList from "@/components/pos/RealtimeSalesList";

export const dynamic = "force-dynamic";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ date_from?: string; date_to?: string }>;
}) {
  const { date_from, date_to } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("sales")
    .select(`*, profiles(full_name)`, { count: "exact" })
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  if (date_from) query = query.gte("created_at", `${date_from}T00:00:00`);
  if (date_to) query = query.lte("created_at", `${date_to}T23:59:59`);

  const { data: sales, count } = await query;

  return (
    <Suspense fallback={
      <div className="flex flex-col gap-5 animate-fade-in pb-24 md:pb-0">
        <div className="skeleton h-12 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
          <div className="skeleton h-20 rounded-xl" />
        </div>
        <div className="card p-6"><div className="skeleton h-96 w-full" /></div>
      </div>
    }>
      <RealtimeSalesList
        initialSales={(sales ?? []) as any}
        initialCount={count ?? 0}
      />
    </Suspense>
  );
}
