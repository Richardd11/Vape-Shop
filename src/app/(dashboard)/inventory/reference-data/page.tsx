import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Tag, Layers, Droplet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ReferenceDataForm from "@/components/inventory/ReferenceDataForm";

export const revalidate = 30;

export default async function ReferenceDataPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();

  if (profile?.role !== "admin") {
    redirect("/inventory");
  }

  const [
    { data: brands },
    { data: categories },
    { data: flavors }
  ] = await Promise.all([
    supabase.from("brands").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    supabase.from("flavors").select("*").order("name"),
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center gap-4">
        <Link href="/inventory" className="btn btn-ghost w-10 h-10 p-0 flex items-center justify-center rounded-xl">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">Reference Data</h1>
          <p className="text-sm text-[var(--color-text-tertiary)]">Manage Brands, Categories, and Flavors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Brands */}
        <div className="card border border-[var(--color-border-default)] flex flex-col h-[400px] md:h-[500px]">
          <div className="p-3 md:p-4 border-b border-[var(--color-border-subtle)] flex items-center gap-2">
            <Tag size={16} className="text-indigo-400" />
            <h2 className="font-semibold text-sm md:text-base text-[var(--color-text-primary)]">Brands</h2>
          </div>
          <div className="p-3 md:p-4 flex-1 overflow-y-auto">
            <ReferenceDataForm type="brands" items={brands ?? []} />
          </div>
        </div>

        {/* Categories */}
        <div className="card border border-[var(--color-border-default)] flex flex-col h-[400px] md:h-[500px]">
          <div className="p-3 md:p-4 border-b border-[var(--color-border-subtle)] flex items-center gap-2">
            <Layers size={16} className="text-blue-400" />
            <h2 className="font-semibold text-sm md:text-base text-[var(--color-text-primary)]">Categories</h2>
          </div>
          <div className="p-3 md:p-4 flex-1 overflow-y-auto">
            <ReferenceDataForm type="categories" items={categories ?? []} />
          </div>
        </div>

        {/* Flavors */}
        <div className="card border border-[var(--color-border-default)] flex flex-col h-[400px] md:h-[500px]">
          <div className="p-3 md:p-4 border-b border-[var(--color-border-subtle)] flex items-center gap-2">
            <Droplet size={16} className="text-purple-400" />
            <h2 className="font-semibold text-sm md:text-base text-[var(--color-text-primary)]">Flavors</h2>
          </div>
          <div className="p-3 md:p-4 flex-1 overflow-y-auto">
            <ReferenceDataForm type="flavors" items={flavors ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
