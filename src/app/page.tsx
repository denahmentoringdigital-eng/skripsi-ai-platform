import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { APP_NAME, PLAN_LIMITS } from "@/lib/constants";

const FEATURES = [
  {
    icon: "📝",
    title: "Draf Bab Otomatis",
    desc: "Masukkan judul dan topik penelitianmu, AI menyusun draf BAB I-V lengkap dengan sub-bab standar akademik yang bisa langsung kamu sempurnakan.",
  },
  {
    icon: "📚",
    title: "Manajemen Referensi",
    desc: "Catat dan rapikan daftar pustaka sesuai format sitasi (APA, Vancouver, IEEE, Chicago) yang dipakai kampusmu.",
  },
  {
    icon: "🗂️",
    title: "Struktur Sesuai Standar Kampus",
    desc: "Template bab disusun mengikuti struktur skripsi umum di Indonesia, tinggal disesuaikan dengan pedoman program studimu.",
  },
  {
    icon: "✍️",
    title: "Editor per Bab",
    desc: "Edit langsung hasil draf AI di setiap bab, simpan progres kapan saja, dan lanjutkan menulis tanpa kehilangan riwayat.",
  },
  {
    icon: "⚡",
    title: "Hemat Waktu Riset Awal",
    desc: "Percepat proses menyusun kerangka dan draf awal sehingga waktumu lebih banyak dipakai untuk riset dan analisis data asli.",
  },
  {
    icon: "🔒",
    title: "Data Privat & Aman",
    desc: "Setiap proyek skripsi hanya bisa diakses oleh akunmu sendiri, tersimpan aman di database pribadi platform.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Buat Proyek Skripsi",
    desc: "Isi judul, topik penelitian, program studi, dan format sitasi kampusmu.",
  },
  {
    step: "2",
    title: "Generate Draf per Bab",
    desc: "Klik generate pada tiap bab (BAB I-V), AI menyusun draf terstruktur dalam hitungan detik.",
  },
  {
    step: "3",
    title: "Edit & Sempurnakan",
    desc: "Sunting langsung di editor, lengkapi dengan data dan sumber asli hasil risetmu.",
  },
  {
    step: "4",
    title: "Unduh & Konsultasikan",
    desc: "Bawa draf ke dosen pembimbing sebagai starting point diskusi, bukan hasil akhir.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
            <span className="mb-5 inline-block rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold text-brand-700">
              Asisten AI Penyusun Skripsi untuk Mahasiswa Indonesia
            </span>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight text-slate-900 md:text-5xl">
              Susun Draf Skripsi Lebih Cepat, Terstruktur, dan Sesuai Standar Kampus
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              {APP_NAME} membantu kamu melewati "blank page syndrome" dengan menyusun draf awal
              BAB I sampai BAB V, merapikan sitasi, dan menjaga progres penulisan tetap
              terorganisir — supaya waktumu fokus ke riset dan analisis, bukan mumet di
              format.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="btn-primary !px-7 !py-3.5 text-base">
                Mulai Gratis Sekarang
              </Link>
              <Link href="#cara-kerja" className="btn-secondary !px-7 !py-3.5 text-base">
                Lihat Cara Kerjanya
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Tanpa kartu kredit · {PLAN_LIMITS.FREE.monthlyCredits}x generate AI gratis per bulan
            </p>
          </div>
        </section>

        {/* Disclaimer strip */}
        <section className="border-y border-amber-100 bg-amber-50">
          <div className="mx-auto max-w-6xl px-6 py-3 text-center text-sm text-amber-800">
            ⚠️ {APP_NAME} menghasilkan <strong>draf bantu menulis</strong>, bukan karya akhir siap
            kumpul. Selalu revisi, lengkapi data asli, dan cek kebijakan penggunaan AI di
            kampusmu sebelum menyerahkan tugas akhir.
          </div>
        </section>

        {/* Fitur */}
        <section id="fitur" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Semua yang Kamu Butuhkan untuk Mulai Menulis</h2>
            <p className="mt-3 text-slate-600">
              Fokus pada berpikir dan riset — biarkan {APP_NAME} membantu bagian penyusunan
              draf dan strukturnya.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card">
                <div className="mb-4 text-3xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cara Kerja */}
        <section id="cara-kerja" className="bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900">Cara Kerjanya</h2>
              <p className="mt-3 text-slate-600">Empat langkah sederhana dari ide sampai draf siap direvisi.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                    {s.step}
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{s.title}</h3>
                  <p className="text-sm text-slate-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="rounded-3xl bg-brand-500 px-8 py-16 text-white">
            <h2 className="text-3xl font-bold">Siap Menyusun Draf Skripsimu Hari Ini?</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">
              Daftar gratis, buat proyek pertamamu, dan rasakan bedanya mulai menulis dengan
              kerangka yang sudah rapi.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-7 py-3.5 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Buat Akun Gratis
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
