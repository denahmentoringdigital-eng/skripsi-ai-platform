"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAJORS, CITATION_FORMATS } from "@/lib/constants";

export default function NewProjectForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    topic: "",
    major: MAJORS[0],
    citationFmt: CITATION_FORMATS[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Gagal membuat proyek.");
      return;
    }

    router.push(`/dashboard/projects/${data.project.id}`);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Buat Proyek Skripsi Baru</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Judul Skripsi</label>
            <input
              className="input"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder='Contoh: "Pengaruh Digital Marketing terhadap Keputusan Pembelian..."'
            />
          </div>
          <div>
            <label className="label">Topik / Fokus Penelitian</label>
            <textarea
              className="input min-h-[90px]"
              required
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Jelaskan singkat masalah, variabel, atau objek penelitianmu"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Program Studi</label>
              <select
                className="input"
                value={form.major}
                onChange={(e) => setForm({ ...form, major: e.target.value })}
              >
                {MAJORS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Format Sitasi</label>
              <select
                className="input"
                value={form.citationFmt}
                onChange={(e) => setForm({ ...form, citationFmt: e.target.value })}
              >
                {CITATION_FORMATS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Membuat..." : "Buat Proyek"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
