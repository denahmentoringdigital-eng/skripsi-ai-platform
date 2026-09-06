"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ThesisProjectModel, ChapterStatus } from "@/types/models";

const STATUS_LABEL: Record<ChapterStatus, string> = {
  EMPTY: "Belum digenerate",
  DRAFTING: "Sedang digenerate...",
  DRAFTED: "Draf AI",
  EDITED: "Sudah diedit",
};

const STATUS_COLOR: Record<ChapterStatus, string> = {
  EMPTY: "bg-slate-100 text-slate-500",
  DRAFTING: "bg-amber-100 text-amber-700",
  DRAFTED: "bg-brand-100 text-brand-700",
  EDITED: "bg-emerald-100 text-emerald-700",
};

export default function ProjectDetailClient({ project }: { project: ThesisProjectModel }) {
  const router = useRouter();
  const [chapters, setChapters] = useState(project.chapters);
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0];

  function updateActiveContent(content: string) {
    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapter.id ? { ...c, content } : c))
    );
  }

  async function handleGenerate() {
    if (!activeChapter) return;
    setError(null);
    setGenerating(true);

    const res = await fetch(
      `/api/projects/${project.id}/chapters/${activeChapter.id}/generate`,
      { method: "POST" }
    );
    const data = await res.json();

    setGenerating(false);

    if (!res.ok) {
      setError(data.error || "Gagal generate draf.");
      return;
    }

    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapter.id ? { ...c, ...data.chapter } : c))
    );
  }

  async function handleSave() {
    if (!activeChapter) return;
    setSaving(true);
    setError(null);

    const res = await fetch(
      `/api/projects/${project.id}/chapters/${activeChapter.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: activeChapter.content }),
      }
    );
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Gagal menyimpan.");
      return;
    }

    setChapters((prev) =>
      prev.map((c) => (c.id === activeChapter.id ? { ...c, ...data.chapter } : c))
    );
  }

  async function handleDeleteProject() {
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  if (!activeChapter) return null;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{project.topic}</p>
          <div className="mt-2 flex gap-2 text-xs text-slate-400">
            <span>{project.major}</span>
            <span>·</span>
            <span>Sitasi {project.citationFmt}</span>
          </div>
        </div>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm font-medium text-red-500 hover:text-red-700"
          >
            Hapus Proyek
          </button>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">Yakin hapus proyek ini?</span>
            <button onClick={handleDeleteProject} className="font-semibold text-red-600">
              Ya, hapus
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-slate-500">
              Batal
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar bab */}
        <aside className="space-y-2">
          {chapters.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChapterId(c.id)}
              className={`block w-full rounded-lg px-4 py-3 text-left text-sm transition ${
                c.id === activeChapter.id
                  ? "bg-brand-500 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              } border border-slate-200`}
            >
              <div className="font-medium">
                BAB {c.number} — {c.title}
              </div>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${
                  c.id === activeChapter.id ? "bg-white/20 text-white" : STATUS_COLOR[c.status]
                }`}
              >
                {STATUS_LABEL[c.status]}
              </span>
            </button>
          ))}
        </aside>

        {/* Editor */}
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              BAB {activeChapter.number} — {activeChapter.title}
            </h2>
            <div className="flex gap-2">
              <button onClick={handleGenerate} disabled={generating} className="btn-secondary">
                {generating
                  ? "Menggenerate..."
                  : activeChapter.content
                  ? "Generate Ulang"
                  : "Generate dengan AI"}
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <textarea
            className="input min-h-[480px] font-mono text-sm leading-relaxed"
            value={activeChapter.content}
            onChange={(e) => updateActiveContent(e.target.value)}
            placeholder="Klik 'Generate dengan AI' untuk membuat draf awal bab ini, atau tulis sendiri di sini..."
          />
          <p className="mt-3 text-xs text-slate-400">
            Ingat: ini draf bantu menulis. Ganti semua placeholder, verifikasi data dan sitasi
            dengan sumber asli sebelum menyerahkan ke dosen pembimbing.
          </p>
        </div>
      </div>
    </div>
  );
}
