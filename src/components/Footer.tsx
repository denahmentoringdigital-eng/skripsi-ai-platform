import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="mb-2 text-lg font-bold text-slate-900">{APP_NAME}</div>
            <p className="text-sm text-slate-500">
              Asisten AI untuk membantu mahasiswa menyusun draf skripsi/tugas akhir lebih cepat
              dan terstruktur.
            </p>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-slate-700">Tautan</div>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/#fitur" className="hover:text-brand-600">Fitur</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-600">Harga</Link></li>
              <li><Link href="/register" className="hover:text-brand-600">Daftar</Link></li>
            </ul>
          </div>
          <div>
            <div className="mb-3 text-sm font-semibold text-slate-700">Etika Akademik</div>
            <p className="text-sm text-slate-500">
              {APP_NAME} membantu menyusun DRAF AWAL, bukan menggantikan proses berpikir dan
              riset mahasiswa. Selalu cek pedoman penggunaan AI di kampusmu sebelum
              mengumpulkan karya akhir.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} {APP_NAME}. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  );
}
