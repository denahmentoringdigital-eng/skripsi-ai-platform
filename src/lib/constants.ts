export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "ThesisPilot AI";

export const MAJORS = [
  "Manajemen",
  "Akuntansi",
  "Teknik Informatika",
  "Sistem Informasi",
  "Ilmu Komunikasi",
  "Hukum",
  "Psikologi",
  "Pendidikan",
  "Ilmu Administrasi",
  "Lainnya",
];

export const CITATION_FORMATS = ["APA", "Vancouver", "IEEE", "Chicago"];

export const CHAPTER_TEMPLATE: { number: number; title: string }[] = [
  { number: 1, title: "Pendahuluan" },
  { number: 2, title: "Tinjauan Pustaka" },
  { number: 3, title: "Metodologi Penelitian" },
  { number: 4, title: "Hasil dan Pembahasan" },
  { number: 5, title: "Penutup" },
];

export const PLAN_LIMITS: Record<"FREE" | "PRO" | "CAMPUS", { monthlyCredits: number; label: string; priceIDR: number }> = {
  FREE: { monthlyCredits: 3, label: "Gratis", priceIDR: 0 },
  PRO: { monthlyCredits: 100, label: "Pro", priceIDR: 79000 },
  CAMPUS: { monthlyCredits: 1000, label: "Kampus", priceIDR: 499000 },
};
