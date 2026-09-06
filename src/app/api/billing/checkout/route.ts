import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUpgradeCheckout, type MayarPlan } from "@/lib/mayar";
import { PLAN_LIMITS } from "@/lib/constants";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const plan = body.plan;
  if (plan !== "PRO" && plan !== "CAMPUS") {
    return NextResponse.json({ error: "Paket harus PRO atau CAMPUS." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  }

  try {
    const { payUrl, mayarMemberId, tierId } = await createUpgradeCheckout({
      name: user.name,
      email: user.email,
      plan: plan as MayarPlan,
    });

    const amount = PLAN_LIMITS[plan as MayarPlan].priceIDR;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { mayarMemberId },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          plan,
          amount,
          status: "PENDING",
          mayarMemberId,
          rawPayload: JSON.stringify({ tierId, payUrl }),
        },
      }),
    ]);

    return NextResponse.json({ url: payUrl });
  } catch (err) {
    console.error("Billing checkout error:", err);
    const message = err instanceof Error ? err.message : "Gagal membuat link pembayaran. Coba lagi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
