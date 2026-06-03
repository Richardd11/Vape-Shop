import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "@/components/inventory/ProductForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();

  if (profile?.role !== "admin") {
    redirect("/inventory");
  }

  // Fetch reference data for dropdowns
  const [
    { data: brands },
    { data: categories },
    { data: flavors }
  ] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("flavors").select("id, name").order("name")
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/inventory" className="btn btn-ghost w-10 h-10 p-0 flex items-center justify-center rounded-xl">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Add Product</h1>
          <p className="text-sm text-[var(--color-text-tertiary)]">Create a new product and variants</p>
        </div>
      </div>

      <div className="card p-4 md:p-6">
        <ProductForm 
          brands={brands ?? []} 
          categories={categories ?? []} 
          flavors={flavors ?? []} 
        />
      </div>
    </div>
  );
}
