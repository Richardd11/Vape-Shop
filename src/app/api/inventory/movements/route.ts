import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/inventory/movements
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const productId = searchParams.get("product_id");
  const type = searchParams.get("type");
  const from = (page - 1) * limit;

  let query = supabase
    .from("inventory_movements")
    .select(`
      *,
      products(id, name, sku),
      product_variants(id, sku_variant, flavors(name)),
      profiles(full_name)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (productId) query = query.eq("product_id", productId);
  if (type) query = query.eq("type", type);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}

// POST /api/inventory/movements — manual stock in/out
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — Admin only" }, { status: 403 });
  }

  const body = await request.json();
  const { product_id, variant_id, type, quantity, notes } = body;

  if (!product_id || !type || quantity === undefined) {
    return NextResponse.json({ error: "product_id, type, quantity required" }, { status: 400 });
  }

  // Log movement
  const { data: movement, error: movErr } = await supabase
    .from("inventory_movements")
    .insert({ product_id, variant_id, type, quantity, notes, performed_by: user.id })
    .select()
    .single();

  if (movErr) return NextResponse.json({ error: movErr.message }, { status: 500 });

  // Update variant stock
  if (variant_id) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("stock")
      .eq("id", variant_id)
      .single();

    if (variant) {
      const newStock = Math.max(0, variant.stock + quantity);
      await supabase
        .from("product_variants")
        .update({ stock: newStock })
        .eq("id", variant_id);
    }
  }

  return NextResponse.json(movement, { status: 201 });
}
