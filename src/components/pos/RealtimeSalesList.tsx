"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRealtimeSales } from "@/lib/realtime";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";
import { Search, FileText, ChevronRight, Filter, DollarSign, ReceiptText, Percent, Calendar } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface SaleRow {
  id: string;
  cashier_id: string;
  payment_type: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  profiles?: { full_name: string } | { full_name: string }[];
}

export default function RealtimeSalesList({
  initialSales,
  initialCount,
}: {
  initialSales: SaleRow[];
  initialCount: number;
}) {
  const searchParams = useSearchParams();
  const date_from = searchParams.get("date_from") || "";
  const date_to = searchParams.get("date_to") || "";

  const [sales, setSales] = useState<SaleRow[]>(initialSales);
  const [count, setCount] = useState(initialCount);
  const mountedRef = useRef(false);

  const fetchSales = useCallback(async () => {
    const params = new URLSearchParams();
    if (date_from) params.set("date_from", date_from);
    if (date_to) params.set("date_to", date_to);

    const res = await fetch(`/api/sales?${params}`);
    if (res.ok) {
      const json = await res.json();
      const salesList = json.data ?? json;
      if (Array.isArray(salesList)) {
        setSales(salesList);
        setCount(json.count ?? salesList.length);
      }
    }
  }, [date_from, date_to]);

  useEffect(() => {
    if (mountedRef.current) {
      fetchSales();
    }
    mountedRef.current = true;
  }, [fetchSales]);

  useRealtimeSales(() => fetchSales());

  const totalRevenue = sales?.reduce((s, r) => s + r.total_amount, 0) ?? 0;
  const totalDiscounts = sales?.reduce((s, r) => s + r.discount_amount, 0) ?? 0;

  const hasFilters = !!(date_from || date_to);

  const paymentBadge = (type: string) => {
    if (type === "cash") return "badge badge-success";
    if (type === "gcash") return "badge badge-info";
    return "badge badge-brand";
  };

  function getProfileName(sale: SaleRow): string {
    const profiles = sale.profiles;
    if (Array.isArray(profiles)) return profiles[0]?.full_name ?? "Unknown";
    if (profiles && typeof profiles === "object" && "full_name" in profiles) return profiles.full_name ?? "Unknown";
    return "Unknown";
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in pb-24 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-0.5">Sales History</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">View and analyze transaction records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
              <DollarSign size={18} className="text-brand-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-text-tertiary)] truncate">Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-brand-400 truncate">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0">
              <ReceiptText size={18} className="text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-text-tertiary)] truncate">Transactions</p>
              <p className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] truncate">{count}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
              <Percent size={18} className="text-danger" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-text-tertiary)] truncate">Discounts</p>
              <p className="text-lg sm:text-xl font-bold text-danger truncate">{formatCurrency(totalDiscounts)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <form className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex gap-3 items-end flex-1">
            <div className="flex flex-col gap-1 flex-1 sm:flex-initial">
              <label className="text-[0.65rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">From</label>
              <input type="date" name="date_from" defaultValue={date_from} className="input input-sm w-full sm:w-36 text-xs" />
            </div>
            <div className="flex flex-col gap-1 flex-1 sm:flex-initial">
              <label className="text-[0.65rem] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">To</label>
              <input type="date" name="date_to" defaultValue={date_to} className="input input-sm w-full sm:w-36 text-xs" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-ghost btn-sm flex items-center gap-1.5">
              <Filter size={14} /> Filter
            </button>
            {hasFilters && (
              <Link href="/sales" className="btn btn-danger-ghost btn-sm flex items-center gap-1.5">
                Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      <div className="card overflow-hidden flex flex-col min-h-[300px]">
        <div className="hidden md:block overflow-x-auto flex-1">
          <table className="w-full max-w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="table-header-cell">Date & Time</th>
                <th className="table-header-cell">Receipt</th>
                <th className="table-header-cell">Cashier</th>
                <th className="table-header-cell text-center">Payment</th>
                <th className="table-header-cell text-right">Total</th>
                <th className="table-header-cell w-12"></th>
              </tr>
            </thead>
            <tbody>
              {sales?.map((sale) => (
                <tr key={sale.id} className="border-b border-[var(--color-border-subtle)] transition-colors hover:bg-white/[0.03] group">
                  <td className="table-cell whitespace-nowrap">
                    <p className="font-medium text-[var(--color-text-primary)] text-sm">{formatDateTime(sale.created_at)}</p>
                  </td>
                  <td className="table-cell font-mono text-xs text-[var(--color-text-secondary)]">
                    #{sale.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="table-cell text-[var(--color-text-secondary)]">
                    {getProfileName(sale)}
                  </td>
                  <td className="table-cell text-center">
                    <span className={paymentBadge(sale.payment_type)}>{sale.payment_type}</span>
                  </td>
                  <td className="table-cell text-right font-bold text-brand-400">
                    {formatCurrency(sale.total_amount)}
                  </td>
                  <td className="table-cell text-right">
                    <Link href={`/sales/${sale.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors">
                      <ChevronRight size={16} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden flex flex-col divide-y divide-[var(--color-border-subtle)] flex-1">
          {sales?.map((sale) => (
            <Link key={sale.id} href={`/sales/${sale.id}`} className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors active:bg-white/[0.06]">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[0.65rem]", paymentBadge(sale.payment_type))}>
                    {sale.payment_type}
                  </span>
                  <span className="font-mono text-[0.65rem] text-[var(--color-text-tertiary)]">
                    #{sale.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {formatCurrency(sale.total_amount)}
                </p>
                <div className="flex items-center gap-2 text-[0.675rem] text-[var(--color-text-tertiary)]">
                  <Calendar size={10} />
                  <span>{formatDateTime(sale.created_at)}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--color-text-tertiary)] shrink-0 ml-2" />
            </Link>
          ))}
        </div>

        {(!sales || sales.length === 0) && (
          <div className="py-16 text-center flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 opacity-50">
              <FileText size={40} className="text-[var(--color-text-tertiary)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">No sales records found</p>
              {hasFilters && <Link href="/sales" className="text-xs text-brand-400 hover:underline">Clear filters</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
