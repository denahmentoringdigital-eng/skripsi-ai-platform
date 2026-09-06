import type { User } from "@prisma/client";
import { PLAN_LIMITS } from "@/lib/constants";

export type PlanKey = keyof typeof PLAN_LIMITS;

// Plan yang BENAR-BENAR berlaku sekarang. Kalau paket berbayar (PRO/CAMPUS)
// sudah lewat planExpiresAt, anggap sudah turun ke FREE walau webhook
// "membership.memberExpired" dari Mayar belum sempat masuk / gagal terkirim.
export function getEffectivePlan(user: Pick<User, "plan" | "planExpiresAt">): PlanKey {
  const plan = (user.plan as PlanKey) in PLAN_LIMITS ? (user.plan as PlanKey) : "FREE";
  if (plan === "FREE") return "FREE";
  if (!user.planExpiresAt) return plan;
  return user.planExpiresAt.getTime() > Date.now() ? plan : "FREE";
}

export function getPlanLimit(user: Pick<User, "plan" | "planExpiresAt">) {
  return PLAN_LIMITS[getEffectivePlan(user)];
}
