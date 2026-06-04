import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateSKU } from "@/lib/utils";

// GET /api/products — list products with variants + brand + category
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type") ?? "";
  const categoryId = searchParams.get("category_id") ?? "";
  const brandId = searchParams.get("brand_id") ?? "";
  const lowStock = searchParams.get("low_stock") === "true";
  const activeOnly = searchParams.get("active_only") !== "false";
  const view = searchParams.get("view") ?? "";

  // Use products_with_stock view for inventory-style flat data
  if (view === "with_stock") {
    let query = supabase
      .from("products_with_stock")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    if (type && type !== "all") {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  let query = supabase
    .from("products")
    .select(`
      *,
      brands(id, name),
      categories(id, name),
      product_variants(*, flavors(id, name))
    `)
    .order("name");

  if (activeOnly) query = query.eq("is_active", true);
  if (type) query = query.eq("type", type);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (brandId) query = query.eq("brand_id", brandId);
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let products = data ?? [];
  if (lowStock) {
    products = products.filter((p) => {
      const totalStock = (p.product_variants as { stock: number }[])
        ?.reduce((s: number, v: { stock: number }) => s + v.stock, 0) ?? 0;
      return totalStock <= p.low_stock_alert;
    });
  }

  return NextResponse.json(products);
}

// POST /api/products — create product with variants
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { variants, ...productData } = body;

  // Auto-generate SKU if empty
  if (!productData.sku) {
    const { data: brand } = await supabase.from("brands").select("name").eq("id", productData.brand_id).single();
    const { data: cat } = await supabase.from("categories").select("name").eq("id", productData.category_id).single();
    productData.sku = generateSKU(brand?.name ?? "UNK", cat?.name ?? "UNK", productData.name);
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });

  // Insert variants
  if (variants && variants.length > 0) {
    const variantData = variants.map((v: Record<string, unknown>, idx: number) => ({
      ...v,
      product_id: product.id,
      sku_variant: v.sku_variant || `${product.sku}-V${idx + 1}`,
    }));

    const { error: variantError } = await supabase
      .from("product_variants")
      .insert(variantData);

    if (variantError) return NextResponse.json({ error: variantError.message }, { status: 500 });
  }

  return NextResponse.json(product, { status: 201 });
}
