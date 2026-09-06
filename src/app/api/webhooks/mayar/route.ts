import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMayarPlanFromTierId } from "@/lib/mayar";

// Mayar tidak menandatangani body webhook-nya (beda dengan Stripe), jadi verifikasi
// dilakukan lewat token rahasia yang kita tempel sendiri di query string saat
// mendaftarkan Webhook URL di dashboard Mayar (?token=...).
function isValidToken(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const expected = process.env.MAYAR_WEBHOOK_TOKEN;
  return Boolean(expected) && token === expected;
}

interface MayarWebhookPayload {
  event?: string;
  data?: {
    id?: string;
    transactionId?: string;
    status?: string;
    customerName?: string;
    customerEmail?: string;
    amount?: number;
    productType?: string;
    membershipTierName?: string;
    membershipCustomer?: {
      id?: string;
      memberId?: string;
      status?: string;
      membershipTierId?: string;
      expiredAt?: number | string | null;
    };
  };
}

export async function GET(req: Request) {
  // Dipakai tombol "TEST URL" di dashboard Mayar untuk cek endpoint hidup.
  if (!isValidToken(req)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  if (!isValidToken(req)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  let payload: MayarWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const data = payload.data || {};

  try {
    if (event === "payment.received" && data.membershipCustomer) {
      await handlePaymentReceived(data);
    } else if (event === "membership.memberExpired" || event === "membership.memberUnsubscribed") {
      await handleMembershipEnded(data);
    } else {
      // Event lain (reminder, newMemberRegistered, changeTier, tracking, dll) -> cukup dicatat.
      console.log("Mayar webhook diterima (tidak diproses khusus):", event);
    }
  } catch (err) {
    // Tetap balas 200 supaya Mayar tidak retry terus, tapi catat errornya di log server.
    console.error("Gagal memproses webhook Mayar:", err);
  }

  return NextResponse.json({ ok: true });
}

async function handlePaymentReceived(data: NonNullable<MayarWebhookPayload["data"]>) {
  const email = data.customerEmail?.toLowerCase().trim();
  if (!email) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.warn("Webhook payment.received: user dengan email berikut tidak ditemukan:", email);
    return;
  }

  const tierId = data.membershipCustomer?.membershipTierId;
  const plan = getMayarPlanFromTierId(tierId);
  const expiredAtRaw = data.membershipCustomer?.expiredAt;
  const planExpiresAt = expiredAtRaw ? new Date(Number(expiredAtRaw) || expiredAtRaw) : null;

  await prisma.$transaction(async (tx) => {
    if (plan) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          plan,
          planExpiresAt: planExpiresAt && !isNaN(planExpiresAt.getTime()) ? planExpiresAt : null,
          aiCreditsUsed: 0,
          mayarMemberId: data.membershipCustomer?.memberId || user.mayarMemberId,
        },
      });
    }

    const pending = await tx.transaction.findFirst({
      where: { userId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    if (pending) {
      await tx.transaction.update({
        where: { id: pending.id },
        data: {
          status: "SUCCESS",
          mayarTransactionId: data.transactionId || data.id,
          rawPayload: JSON.stringify(data),
        },
      });
    } else {
      await tx.transaction.create({
        data: {
          userId: user.id,
          plan: plan || "UNKNOWN",
          amount: data.amount || 0,
          status: "SUCCESS",
          mayarTransactionId: data.transactionId || data.id,
          mayarMemberId: data.membershipCustomer?.memberId,
          rawPayload: JSON.stringify(data),
        },
      });
    }
  });
}

async function handleMembershipEnded(data: NonNullable<MayarWebhookPayload["data"]>) {
  const email = data.customerEmail?.toLowerCase().trim();
  if (!email) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "FREE", planExpiresAt: null },
  });
}
