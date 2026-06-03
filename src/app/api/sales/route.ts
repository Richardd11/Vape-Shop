import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { CartItem } from "@/lib/types";

// GET /api/sales — paginated sales list
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const from = (page - 1) * limit;

  let query = supabase
    .from("sales")
    .select(`*, profiles(full_name), sale_items(*)`, { count: "exact" })
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}

// POST /api/sales — create a sale transaction
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { items, payment_type, cash_tendered, gcash_amount, change_amount, notes, subtotal, discount_amount, total_amount } = body;

  if (!items?.length) return NextResponse.json({ error: "No items in cart" }, { status: 400 });

  // Insert sale header
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      cashier_id: user.id,
      payment_type,
      subtotal: +(subtotal ?? 0).toFixed(2),
      discount_amount: +(discount_amount ?? 0).toFixed(2),
      total_amount: +(total_amount ?? 0).toFixed(2),
      cash_tendered: cash_tendered != null ? +cash_tendered.toFixed(2) : null,
      gcash_amount: gcash_amount != null ? +gcash_amount.toFixed(2) : null,
      change_amount: +(change_amount ?? 0).toFixed(2),
      notes,
      status: "completed",
    })
    .select()
    .single();

  if (saleError) return NextResponse.json({ error: saleError.message }, { status: 500 });

  // Insert sale items
  const saleItems = items.map((item: CartItem) => ({
    sale_id: sale.id,
    product_id: item.product.id,
    variant_id: item.variant?.id ?? null,
    product_name: item.product.name,
    variant_label: item.variant
      ? [
          item.variant.flavors?.name,
          item.variant.nicotine_strength,
          item.variant.size_ml ? `${item.variant.size_ml}ml` : null,
        ].filter(Boolean).join(" · ")
      : null,
    quantity: item.quantity,
    unit_price: +item.unit_price.toFixed(2),
    discount_amount: +(item.discount_amount ?? 0).toFixed(2),
    line_total: +(item.line_total ?? 0).toFixed(2),
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  // Decrement stock per variant (or product if no variant)
  for (const item of items as CartItem[]) {
    if (item.variant?.id) {
      await supabase.rpc("decrement_variant_stock", {
        p_variant_id: item.variant.id,
        p_quantity: item.quantity,
      });

      // Log inventory movement
      await supabase.from("inventory_movements").insert({
        product_id: item.product.id,
        variant_id: item.variant.id,
        type: "sale",
        quantity: -item.quantity,
        notes: `Sale #${sale.id.substring(0, 8)}`,
        reference_id: sale.id,
        performed_by: user.id,
      });
    }
  }

  return NextResponse.json(sale, { status: 201 });
}
