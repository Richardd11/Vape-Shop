import { NextRequest, NextResponse } from "next/server";
import { createSource } from "@/lib/paymongo";

export async function POST(request: NextRequest) {
  try {
    const { amount, description } = await request.json();
    if (!amount) return NextResponse.json({ error: "Amount required" }, { status: 400 });

    const source = await createSource(amount, description || "VapeShop Purchase");

    return NextResponse.json({
      sourceId: source.data.id,
      checkoutUrl: source.data.attributes.redirect.checkout_url,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
