"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import NewProjectForm from "@/components/NewProjectForm";
import { PLAN_LIMITS } from "@/lib/constants";
import type { ThesisProjectModel } from "@/types/models";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<ThesisProjectModel[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat proyek.");
        return res.json();
      })
      .then((data) => setProjects(data.projects))
      .catch(() => setError("Gagal memuat daftar proyek."));
  }, []);

  const plan = (session?.user as { plan?: string } | undefined)?.plan || "FREE";
  const planInfo = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.FREE;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Halo, {session?.user?.name?.split(" ")[0] || "Mahasiswa"} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Paket kamu: <span className="font-medium text-brand-600">{planInfo.label}</span> ·
            Jatah generate AI {planInfo.monthlyCredits}x/bulan
          </p>
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
