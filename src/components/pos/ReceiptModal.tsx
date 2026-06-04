"use client";

import { X, Printer } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

interface ReceiptModalProps {
  sale: any;
  onClose: () => void;
}

export default function ReceiptModal({ sale, onClose }: ReceiptModalProps) {
  function handlePrint() {
    window.print();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: absolute; left: 0; top: 0; width: 80mm; margin: 0; padding: 10px; background: white; color: black; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        id="receipt-content"
        className="relative bg-white text-black max-w-sm w-full rounded-lg p-6 animate-scale-in overflow-y-auto max-h-[90vh]"
      >
        {/* Close button (no-print) */}
        <button
          onClick={onClose}
          className="no-print absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Shop Header */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold tracking-wide mb-1">
            VapeShop
          </h2>
          <p className="text-[10px] text-gray-500 tracking-wide">
            Your premium vape destination
          </p>
          <div className="mx-auto my-4 w-12 border-t border-gray-300" />
        </div>

        {/* Transaction Info */}
        <div className="flex flex-col gap-0.5 mb-5 text-[11px] text-gray-600">
          <div className="flex justify-between">
            <span>Date</span>
            <span>{formatDateTime(sale.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span>Receipt #</span>
            <span className="font-mono">{sale.id.substring(0, 8).toUpperCase()}</span>
          </div>
          {sale.cashier_name && (
            <div className="flex justify-between">
              <span>Cashier</span>
              <span>{sale.cashier_name}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 my-4" />

        {/* Line Items */}
        <div className="flex flex-col gap-3 mb-4">
          {sale.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-start text-[13px]">
              <div className="flex-1 pr-2">
                <p className="font-semibold leading-tight">
                  {item.product.name ?? item.product_name}
                </p>
                {(item.variant_label || item.variant?.display_label) && (
                  <p className="text-[10px] text-gray-500">
                    {item.variant_label || getVariantFallbackLabel(item.variant)}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {item.quantity} x {formatCurrency(item.unit_price)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(item.line_total)}</p>
                {item.discount_amount > 0 && (
                  <p className="text-[10px] text-red-500">
                    -{formatCurrency(item.discount_amount)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 my-4" />

        {/* Totals */}
        <div className="flex flex-col gap-1.5 text-[13px]">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Discount</span>
              <span>-{formatCurrency(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-300">
            <span>Total</span>
            <span>{formatCurrency(sale.total_amount)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 my-4" />

        {/* Payment & Change */}
        <div className="flex flex-col gap-1 text-[12px] text-gray-600">
          <div className="flex justify-between">
            <span>Payment ({sale.payment_type.toUpperCase()})</span>
            <span>
              {formatCurrency(sale.cash_tendered ?? sale.gcash_amount ?? sale.total_amount)}
            </span>
          </div>
          {sale.change_amount > 0 && (
            <div className="flex justify-between font-semibold text-gray-800">
              <span>Change</span>
              <span>{formatCurrency(sale.change_amount)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-gray-200">
          <p className="font-semibold text-gray-800 text-[13px]">
            Thank you for your purchase!
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            Please come again
          </p>
        </div>

        {/* Print Button (no-print) */}
        <div className="no-print mt-6 flex gap-3">
          <button
            onClick={handlePrint}
            className="btn-ghost flex-1 flex justify-center py-2.5 text-sm"
          >
            <Printer size={16} /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="btn-brand flex-1 flex justify-center py-2.5 text-sm"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}

function getVariantFallbackLabel(variant: any) {
  if (!variant) return "";
  const parts = [];
  if (variant.flavors?.name) parts.push(variant.flavors.name);
  if (variant.nicotine_strength) parts.push(variant.nicotine_strength);
  if (variant.size_ml) parts.push(`${variant.size_ml}ml`);
  return parts.join(" · ");
}
