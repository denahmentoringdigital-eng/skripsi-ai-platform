import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getEffectivePlan } from "@/lib/plan";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [users, newUsers7d, projects, chaptersDrafted, paidAgg, paidThisMonthAgg, pendingTx] =
    await Promise.all([
      prisma.user.findMany({
        select: { plan: true, planExpiresAt: true, aiCreditsUsed: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.thesisProject.count(),
      prisma.chapter.count({ where: { status: "DRAFTED" } }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
    ]);

  const perPlan = { FREE: 0, PRO: 0, CAMPUS: 0 };
  let creditsUsed = 0;
  for (const u of users) {
    perPlan[getEffectivePlan(u)] += 1;
    creditsUsed += u.aiCreditsUsed;
  }

  return NextResponse.json({
    totalUsers: users.length,
    newUsers7d,
    perPlan,
    totalProjects: projects,
    chaptersDrafted,
    creditsUsed,
    revenueTotal: paidAgg._sum.amount ?? 0,
    revenueThisMonth: paidThisMonthAgg._sum.amount ?? 0,
    successTransactions: paidAgg._count,
    successTransactionsThisMonth: paidThisMonthAgg._count,
    pendingTransactions: pendingTx,
  });
}
