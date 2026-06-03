const PAYMONGO_BASE = "https://api.paymongo.com/v1";
const PAYMONGO_KEY = process.env.PAYMONGO_SECRET_KEY!;

function auth() {
  return "Basic " + Buffer.from(PAYMONGO_KEY + ":").toString("base64");
}

export async function createSource(amount: number, description: string) {
  const res = await fetch(`${PAYMONGO_BASE}/sources`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: "PHP",
          type: "gcash",
          redirect: { success: `${process.env.NEXT_PUBLIC_APP_URL}/pos`, failed: `${process.env.NEXT_PUBLIC_APP_URL}/pos` },
          billing: { name: "Customer", email: "customer@vapeshop.ph", phone: "" },
          description,
        },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.errors?.[0]?.detail || "PayMongo source creation failed");
  }
  return res.json();
}

export async function getSource(sourceId: string) {
  const res = await fetch(`${PAYMONGO_BASE}/sources/${sourceId}`, {
    headers: { Authorization: auth() },
  });
  return res.json();
}

export async function createPayment(sourceId: string, amount: number, description: string) {
  const res = await fetch(`${PAYMONGO_BASE}/payments`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: "PHP",
          source: { id: sourceId, type: "source" },
          description,
        },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.errors?.[0]?.detail || "PayMongo payment failed");
  }
  return res.json();
}
