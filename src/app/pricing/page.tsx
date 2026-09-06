import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PLAN_LIMITS } from "@/lib/constants";
import UpgradeButton from "@/components/UpgradeButton";

const PLAN_FEATURES: Record<keyof typeof PLAN_LIMITS, string[]> = {
  FREE: [
    `${PLAN_LIMITS.FREE.monthlyCredits}x generate AI / bulan`,
    "1 proyek skripsi aktif",
    "Template BAB I-V standar",
    "Editor per bab",
  ],
  PRO: [
    `${PLAN_LIMITS.PRO.monthlyCredits}x generate AI / bulan`,
    "Proyek skripsi tanpa batas",
    "Semua format sitasi",
    "Manajemen referensi",
    "Dukungan prioritas via email",
  ],
  CAMPUS: [
    `${PLAN_LIMITS.CAMPUS.monthlyCredits}x generate AI / bulan`,
    "Multi-akun untuk mahasiswa kampus",
    "Laporan penggunaan untuk admin",
    "Onboarding & pelatihan tim",
    "Dukungan prioritas khusus",
  ],
};

function formatIDR(n: number) {
  if (n === 0) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default function PricingPage() {
  const plans: (keyof typeof PLAN_LIMITS)[] = ["FREE", "PRO", "CAMPUS"];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Pilih Paket yang Sesuai</h1>
          <p className="mt-3 text-slate-600">
            Mulai gratis, upgrade kapan saja saat kebutuhan generate draf semakin banyak.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((key) => {
            const plan = PLAN_LIMITS[key];
            const isPopular = key === "PRO";
            return (
              <div
                key={key}
                className={`card relative flex flex-col ${isPopular ? "border-brand-400 ring-2 ring-brand-200" : ""}`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                    Paling Populer
                  </span>
                )}
                <h2 className="text-lg font-semibold text-slate-900">{plan.label}</h2>
                <div className="mt-3 mb-6">
                  <span className="text-3xl font-extrabold text-slate-900">{formatIDR(plan.priceIDR)}</span>
                  {plan.priceIDR > 0 && <span className="text-sm text-slate-500"> /bulan</span>}
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-sm text-slate-600">
                  {PLAN_FEATURES[key].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-brand-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {key === "FREE" ? (
                  <Link href="/register" className="btn-secondary w-full">
                    Mulai Gratis
                  </Link>
                ) : (
                  <UpgradeButton
                    plan={key}
                    label="Pilih Paket"
                    className={isPopular ? "btn-primary w-full" : "btn-secondary w-full"}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          Pembayaran diproses aman lewat Mayar.id. Setelah bayar, akses paket aktif otomatis
          dan kamu akan diarahkan kembali ke dashboard.
        </p>
      </main>
      <Footer />
    </>
  );
}
