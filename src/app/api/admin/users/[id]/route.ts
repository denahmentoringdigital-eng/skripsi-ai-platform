import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAdminEmail } from "@/lib/admin";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("resetPassword"),
    // Kosongkan untuk dibuatkan password sementara acak.
    newPassword: z.string().min(8, "Password minimal 8 karakter").max(100).optional(),
  }),
  z.object({
    action: z.literal("setPlan"),
    plan: z.enum(["FREE", "PRO", "CAMPUS"]),
    // ISO date string, null = tanpa batas (hanya relevan untuk PRO/CAMPUS).
    planExpiresAt: z.string().datetime().nullable().optional(),
    resetCredits: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("setCredits"),
    aiCreditsUsed: z.number().int().min(0).max(1_000_000),
  }),
  z.object({
    action: z.literal("updateProfile"),
    name: z.string().min(2).max(100),
    campus: z.string().max(150).nullable().optional(),
    major: z.string().max(150).nullable().optional(),
  }),
]);

function generateTempPassword() {
  // 12 karakter acak, tanpa karakter yang mudah tertukar (0/O, 1/l/I).
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body request tidak valid." }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Data tidak valid." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

  const data = parsed.data;

  try {
    if (data.action === "resetPassword") {
      const newPassword = data.newPassword || generateTempPassword();
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      console.info(`[admin] ${admin.email} reset password user ${user.email}`);
      // Password ditampilkan SEKALI ke admin agar bisa disampaikan ke user.
      return NextResponse.json({ ok: true, temporaryPassword: newPassword });
    }

    if (data.action === "setPlan") {
      const paid = data.plan !== "FREE";
      const updated = await prisma.user.update({
        where: { id },
        data: {
          plan: data.plan,
          planExpiresAt: paid && data.planExpiresAt ? new Date(data.planExpiresAt) : null,
          ...(data.resetCredits ? { aiCreditsUsed: 0 } : {}),
        },
        select: { plan: true, planExpiresAt: true, aiCreditsUsed: true },
      });
      console.info(`[admin] ${admin.email} set plan ${user.email} -> ${data.plan}`);
      return NextResponse.json({ ok: true, user: updated });
    }

    if (data.action === "setCredits") {
      const updated = await prisma.user.update({
        where: { id },
        data: { aiCreditsUsed: data.aiCreditsUsed },
        select: { aiCreditsUsed: true },
      });
      console.info(`[admin] ${admin.email} set aiCreditsUsed ${user.email} -> ${data.aiCreditsUsed}`);
      return NextResponse.json({ ok: true, user: updated });
    }

    // updateProfile
    const updated = await prisma.user.update({
      where: { id },
      data: { name: data.name, campus: data.campus ?? null, major: data.major ?? null },
      select: { name: true, campus: true, major: true },
    });
    return NextResponse.json({ ok: true, user: updated });
  } catch (err) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ error: "Gagal memperbarui user." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });

  if (user.id === admin.id || isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Akun admin tidak bisa dihapus dari panel." }, { status: 400 });
  }

  try {
    // Proyek, bab, referensi, dan transaksi ikut terhapus (onDelete: Cascade).
    await prisma.user.delete({ where: { id } });
    console.info(`[admin] ${admin.email} deleted user ${user.email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return NextResponse.json({ error: "Gagal menghapus user." }, { status: 500 });
  }
}
