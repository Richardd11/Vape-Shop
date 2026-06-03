import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, FileText, ChevronRight, Filter, DollarSign, ReceiptText, Percent } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const revalidate = 5;

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

  const totalRevenue = sales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const totalDiscounts = sales?.reduce((s, r) => s + r.discount_amount, 0) ?? 0;
  const totalTransactions = count ?? 0;

  const hasFilters = !!(date_from || date_to);

  const paymentBadge = (type: string) => {
    if (type === "cash") return "badge badge-success";
    if (type === "gcash") return "badge badge-info";
    return "badge badge-brand";
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Sales History</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">View and analyze transaction records</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-[var(--color-brand-400)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Filtered Revenue</p>
              <p className="text-xl font-bold text-[var(--color-brand-400)]">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0">
              <ReceiptText size={18} className="text-[var(--color-info)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Transactions</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
              <Percent size={18} className="text-[var(--color-danger)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Total Discounts</p>
              <p className="text-xl font-bold text-[var(--color-danger)]">{formatCurrency(totalDiscounts)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Card with Table */}
      <div className="card overflow-hidden flex flex-col min-h-[400px]">
        {/* Filter Bar */}
        <div className="p-4 border-b border-[var(--color-border-subtle)] flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <form className="flex gap-3 items-end flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">From</label>
              <input
                type="date"
                name="date_from"
                defaultValue={date_from}
                className="input py-1.5 text-sm w-36"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--color-text-secondary)]">To</label>
              <input
                type="date"
                name="date_to"
                defaultValue={date_to}
                className="input py-1.5 text-sm w-36"
              />
            </div>
            <button type="submit" className="btn btn-ghost py-1.5 px-3">
              <Filter size={16} /> Filter
            </button>
            {hasFilters && (
              <Link href="/sales" className="btn btn-danger-ghost py-1.5 px-3">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full max-w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell hidden sm:table-cell">Receipt</th>
                <th className="table-header-cell hidden sm:table-cell">Cashier</th>
                <th className="table-header-cell text-center">Payment</th>
                <th className="table-header-cell text-right">Total</th>
                <th className="table-header-cell"></th>
              </tr>
            </thead>
            <tbody>
              {sales?.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-[var(--color-border-subtle)] transition-colors hover:bg-white/[0.03] group"
                >
                  <td className="table-cell whitespace-nowrap">
                    <p className="font-medium text-[var(--color-text-primary)] text-sm">{formatDateTime(sale.created_at)}</p>
                  </td>
                  <td className="table-cell font-mono text-xs text-[var(--color-text-secondary)] hidden sm:table-cell">
                    #{sale.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="table-cell text-[var(--color-text-secondary)] hidden sm:table-cell">
                    {(sale.profiles as any)?.full_name ?? "Unknown"}
                  </td>
                  <td className="table-cell text-center">
                    <span className={paymentBadge(sale.payment_type)}>
                      {sale.payment_type}
                    </span>
                  </td>
                  <td className="table-cell text-right font-bold text-[var(--color-brand-400)]">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="table-cell text-right">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <ChevronRight
                        size={16}
                        className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors"
                      />
                    </Link>
                  </td>
                </tr>
              ))}
              {(!sales || sales.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-50">
                      <FileText size={40} className="text-[var(--color-text-tertiary)]" />
                      <p className="text-[var(--color-text-secondary)]">No sales records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
