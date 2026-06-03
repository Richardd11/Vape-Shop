import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EditProductForm from "@/components/inventory/EditProductForm";
import VariantEditor from "@/components/inventory/VariantEditor";

export const revalidate = 5;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();

  if (profile?.role !== "admin") {
    redirect("/inventory");
  }

  // Fetch product with variants
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      brands(id, name),
      categories(id, name),
      product_variants(
        id, sku_variant, flavor_id, flavors(name), nicotine_strength, size_ml, puff_count, device_compat, price_override, stock, is_active
      )
    `)
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch reference data for dropdowns
  const [
    { data: brands },
    { data: categories }
  ] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/inventory" className="btn btn-ghost w-10 h-10 p-0 flex items-center justify-center rounded-xl">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Edit Product</h1>
          <p className="text-sm text-[var(--color-text-tertiary)]">Modify product details</p>
        </div>
      </div>

      <div className="card p-4 md:p-6">
        <EditProductForm 
          product={product} 
          brands={brands ?? []} 
          categories={categories ?? []} 
        />
      </div>

      <VariantEditor productId={product.id} variants={product.product_variants} />
    </div>
  );
}
