import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/products/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`*, brands(id, name), categories(id, name), product_variants(*, flavors(id, name))`)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { variants, ...productData } = body;

  let product = null;
  
  // Only update product if there are product-level fields
  if (Object.keys(productData).length > 0) {
    const result = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()
      .single();
    
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    product = result.data;
  } else {
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    product = data;
  }

  // Upsert variants
  if (variants) {
    for (const v of variants) {
      if (v.id) {
        await supabase.from("product_variants").update({ ...v, product_id: id }).eq("id", v.id);
      } else {
        await supabase.from("product_variants").insert({ ...v, product_id: id });
      }
    }
  }

  return NextResponse.json(product);
}

// DELETE /api/products/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Soft delete
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
