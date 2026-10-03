import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAdminEmail } from "@/lib/admin";
import { getEffectivePlan } from "@/lib/plan";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { campus: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        campus: true,
        major: true,
        plan: true,
        planExpiresAt: true,
        aiCreditsUsed: true,
        createdAt: true,
        _count: { select: { projects: true } },
      },
    }),
  ]);

  const users = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    campus: u.campus,
    major: u.major,
    plan: u.plan,
    effectivePlan: getEffectivePlan(u),
    planExpiresAt: u.planExpiresAt ? u.planExpiresAt.toISOString() : null,
    aiCreditsUsed: u.aiCreditsUsed,
    projectCount: u._count.projects,
    createdAt: u.createdAt.toISOString(),
    isAdmin: isAdminEmail(u.email),
  }));

  return NextResponse.json({ users, total, page, pageSize: PAGE_SIZE });
}
