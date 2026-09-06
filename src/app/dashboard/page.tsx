"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import NewProjectForm from "@/components/NewProjectForm";
import { PLAN_LIMITS } from "@/lib/constants";
import type { ThesisProjectModel } from "@/types/models";

type MeInfo = {
  plan: "FREE" | "PRO" | "CAMPUS";
  planExpiresAt: string | null;
  aiCreditsUsed: number;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ThesisProjectModel[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MeInfo | null>(null);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat proyek.");
        return res.json();
      })
      .then((data) => setProjects(data.projects))
      .catch(() => setError("Gagal memuat daftar proyek."));
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat status akun.");
        return res.json();
      })
      .then((data: MeInfo) => setMe(data))
      .catch(() => {
        /* diamkan; fallback ke data session di bawah */
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "success") {
      setShowUpgradeSuccess(true);
      params.delete("upgrade");
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const sessionPlan = (session?.user as { plan?: string } | undefined)?.plan || "FREE";
  const plan = me?.plan || sessionPlan;
  const planInfo = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;
  const expiresAt = me?.planExpiresAt ? new Date(me.planExpiresAt) : null;
  const creditsUsed = me?.aiCreditsUsed ?? 0;

  return (
    <div>
      {showUpgradeSuccess && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>
            🎉 Pembayaran berhasil! Paket kamu sudah aktif. Jika status paket di bawah belum
            berubah, tunggu beberapa detik lalu muat ulang halaman ini.
          </span>
          <button
            onClick={() => setShowUpgradeSuccess(false)}
            className="shrink-0 text-green-700 hover:text-green-900"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>
      )}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Halo, {session?.user?.name?.split(" ")[0] || "Mahasiswa"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Paket kamu: <span className="font-medium text-brand-600">{planInfo.label}</span> ·
            Jatah generate AI {creditsUsed}/{planInfo.monthlyCredits}x bulan ini
          </p>
          {plan !== "FREE" && expiresAt && (
            <p className="mt-1 text-xs text-slate-400">
              Aktif sampai{" "}
              {expiresAt.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Perpanjang otomatis lewat tagihan Mayar.
            </p>
          )}
          {plan === "FREE" && (
            <p className="mt-1 text-xs text-slate-400">
              <Link href="/pricing" className="font-medium text-brand-600 hover:underline">
                Upgrade ke Pro / Kampus
              </Link>{" "}
              untuk jatah generate AI lebih banyak.
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Proyek Baru
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {!projects ? (
        <div className="text-sm text-slate-400">Memuat proyek...</div>
      ) : projects.length === 0 ? (
        <div className="card text-center">
          <p className="text-slate-600">Kamu belum punya proyek skripsi.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
            Buat Proyek Pertamamu
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const draftedCount = p.chapters.filter(
              (c) => c.status === "DRAFTED" || c.status === "EDITED"
            ).length;
            return (
              <Link
                key={p.id}
                href={`/dashboard/projects/${p.id}`}
                className="card block transition hover:border-brand-300 hover:shadow-md"
              >
                <h3 className="mb-1 line-clamp-2 font-semibold text-slate-900">{p.title}</h3>
                <p className="mb-4 line-clamp-2 text-xs text-slate-500">{p.topic}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{p.major}</span>
                  <span>
                    {draftedCount}/{p.chapters.length} bab
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showForm && <NewProjectForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
