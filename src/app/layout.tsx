import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${APP_NAME} — Asisten AI Penyusun Skripsi`,
  description:
    "Platform AI yang membantu mahasiswa menyusun draf skripsi/tugas akhir per bab, merapikan sitasi, dan mempercepat proses penulisan sesuai standar kampus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
      </body>
    </html>
  );
}
