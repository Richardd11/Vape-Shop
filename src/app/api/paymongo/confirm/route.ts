import { NextRequest, NextResponse } from "next/server";
import { createPayment, getSource } from "@/lib/paymongo";
import { createClient } from "@/lib/supabase/server";

// POST: Confirm a payment by creating it from a chargeable source
export async function POST(request: NextRequest) {
  try {
    const { sourceId, amount, saleId, description } = await request.json();

    const src = await getSource(sourceId);
    if (src.data?.attributes?.status !== "chargeable") {
      return NextResponse.json({ error: "Source not chargeable yet", status: src.data?.attributes?.status }, { status: 400 });
    }

    const payment = await createPayment(sourceId, amount, description || "VapeShop Purchase");

    // Update sale status
    if (saleId) {
      const supabase = await createClient();
      await supabase.from("sales").update({ status: "completed", notes: `PayMongo: ${payment.data.id}` }).eq("id", saleId);
    }

    return NextResponse.json({ success: true, paymentId: payment.data.id, status: payment.data.attributes.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
