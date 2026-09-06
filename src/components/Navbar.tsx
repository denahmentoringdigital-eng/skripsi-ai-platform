"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { APP_NAME } from "@/lib/constants";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            ✦
          </span>
          {APP_NAME}
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#fitur" className="hover:text-brand-600">
            Fitur
          </Link>
          <Link href="/#cara-kerja" className="hover:text-brand-600">
            Cara Kerja
          </Link>
          <Link href="/pricing" className="hover:text-brand-600">
            Harga
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {status === "authenticated" ? (
            <>
              <Link href="/dashboard" className="btn-secondary !px-4 !py-2">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Masuk
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-2">
                Coba Gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
