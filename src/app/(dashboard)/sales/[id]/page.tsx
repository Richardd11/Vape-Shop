import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ArrowLeft, Receipt, User, CreditCard, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 5;

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sale, error } = await supabase
    .from("sales")
    .select(`
      *,
      profiles(full_name),
      sale_items(
        id,
        product_name,
        variant_label,
        quantity,
        unit_price,
        discount_amount,
        line_total
      )
    `)
    .eq("id", id)
    .single();

  if (error || !sale) notFound();

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-3xl mx-auto pb-24 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/sales" className="btn btn-ghost w-9 h-9 rounded-xl p-0 shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-[var(--color-text-primary)] truncate">
            <Receipt size={18} className="text-brand-400 shrink-0" />
            <span className="truncate">Receipt #{sale.id.substring(0, 8).toUpperCase()}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">{formatDateTime(sale.created_at)}</p>
        </div>
      </div>

      {/* Summary Cards - Mobile Top */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-[0.65rem] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Total</p>
          <p className="text-lg font-bold text-brand-400">{formatCurrency(sale.total_amount)}</p>
        </div>
        <div className="stat-card">
          <p className="text-[0.65rem] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Items</p>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{sale.sale_items.length}</p>
        </div>
        <div className="stat-card sm:col-span-1 col-span-2">
          <p className="text-[0.65rem] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">Payment</p>
          <p className="text-base font-bold text-info uppercase">{sale.payment_type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Items Section */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-surface-base)]">
              <h2 className="font-semibold text-sm text-[var(--color-text-primary)]">Purchased Items</h2>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header-cell">Item</th>
                    <th className="table-header-cell text-center w-16">Qty</th>
                    <th className="table-header-cell text-right w-24">Price</th>
                    <th className="table-header-cell text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.sale_items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/[0.03]">
                      <td className="table-cell">
                        <p className="font-medium text-[var(--color-text-primary)]">{item.product_name}</p>
                        {item.variant_label && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.variant_label}</p>}
                      </td>
                      <td className="table-cell text-center text-[var(--color-text-secondary)]">{item.quantity}</td>
                      <td className="table-cell text-right text-[var(--color-text-secondary)]">
                        <div>{formatCurrency(item.unit_price)}</div>
                        {item.discount_amount > 0 && (
                          <div className="text-xs text-danger mt-0.5 flex items-center justify-end gap-1">
                            <Tag size={9} /> -{formatCurrency(item.discount_amount / item.quantity)}
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-right font-medium text-[var(--color-text-primary)]">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="sm:hidden divide-y divide-[var(--color-border-subtle)]">
              {sale.sale_items.map((item: any) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.product_name}</p>
                      {item.variant_label && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.variant_label}</p>}
                    </div>
                    <p className="text-sm font-bold text-brand-400 shrink-0">{formatCurrency(item.line_total)}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-tertiary)]">
                    <span>Qty: <strong className="text-[var(--color-text-secondary)]">{item.quantity}</strong></span>
                    <span>@ {formatCurrency(item.unit_price)}</span>
                    {item.discount_amount > 0 && (
                      <span className="text-danger flex items-center gap-1">
                        <Tag size={9} /> -{formatCurrency(item.discount_amount)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="card p-5">
            <h2 className="font-semibold text-sm text-[var(--color-text-primary)] mb-4">Summary</h2>
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-[var(--color-text-secondary)]">
                <span>Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>Discount</span>
                  <span>-{formatCurrency(sale.discount_amount)}</span>
                </div>
              )}
              <div className="divider my-1" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-[var(--color-text-primary)]">Total</span>
                <span className="text-brand-400">{formatCurrency(sale.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="card p-5">
            <h2 className="font-semibold text-sm text-[var(--color-text-primary)] mb-4">Details</h2>
            <div className="flex flex-col gap-4">
              {/* Payment */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-info/10 text-info shrink-0">
                  <CreditCard size={15} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Payment Method</p>
                  <p className="text-sm font-medium text-[var(--color-text-primary)] uppercase">{sale.payment_type}</p>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1 flex flex-col gap-0.5">
                    {sale.cash_tendered !== null && <p>Cash: {formatCurrency(sale.cash_tendered)}</p>}
                    {sale.gcash_amount !== null && <p>GCash: {formatCurrency(sale.gcash_amount)}</p>}
                    {sale.change_amount > 0 && <p className="text-success mt-0.5">Change: {formatCurrency(sale.change_amount)}</p>}
                  </div>
                </div>
              </div>

              {/* Cashier */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                  <User size={15} />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-0.5">Cashier</p>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {(sale.profiles as any)?.full_name ?? "Unknown"}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {sale.notes && (
                <div className="p-3 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-default)]">
                  <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Notes</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{sale.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
