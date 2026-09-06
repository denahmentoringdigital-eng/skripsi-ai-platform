# ThesisPilot AI (Skripsi AI Platform)

Platform AI untuk membantu mahasiswa menyusun **draf awal** skripsi/tugas akhir per bab
(BAB I-V), mengelola referensi, dan mempercepat proses menulis — dibangun sebagai starting
point yang terinspirasi dari kategori produk seperti Skripsita.

> ⚠️ **Catatan penting soal nama/brand**: kode ini sengaja memakai nama placeholder
> `ThesisPilot AI` (bisa diganti lewat env `NEXT_PUBLIC_APP_NAME`), BUKAN nama "Skripsita".
> Kalau kamu berniat memakai domain seperti `ai.easy.skripsita.com`, pertimbangkan risiko
> merek dagang/kebingungan pelanggan karena sangat mirip dengan produk "Skripsita" yang
> sudah ada di `ai.skripsita.com`. Disarankan pakai nama brand sendiri yang berbeda.

## Fitur di versi ini (MVP)

- Landing page + halaman harga (3 paket: Gratis / Pro / Kampus)
- Autentikasi email & password (daftar, masuk, sesi via NextAuth)
- Dashboard untuk membuat & mengelola beberapa proyek skripsi
- Setiap proyek otomatis punya 5 bab (BAB I-V) sesuai struktur standar
- Generate draf tiap bab pakai Claude (Anthropic API), bisa diedit & disimpan
- Batas kuota generate AI per bulan sesuai paket (disimpan di database)
- Model data referensi/sitasi sudah disiapkan di database (siap dikembangkan lebih lanjut)

## Yang BELUM ada / perlu dikembangkan lanjut

- Pembayaran sungguhan (Midtrans/Xendit/Stripe) — saat ini halaman harga baru UI, belum
  memproses transaksi nyata. Field `plan` di database sudah ada, tinggal disambungkan ke
  webhook payment gateway pilihanmu.
- Pencarian referensi otomatis dari jurnal/sumber ilmiah (saat ini tabel `Reference` sudah
  ada di skema tapi UI-nya belum dibuat).
- Reset password / verifikasi email.
- Cek plagiarisme.
- Kolaborasi real-time dengan dosen pembimbing.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma ORM** — dev pakai SQLite, production disarankan pakai PostgreSQL (mis. Neon,
  Supabase, atau Vercel Postgres)
- **NextAuth.js** (credentials provider, JWT session)
- **Anthropic Claude API** untuk generate draf bab

## Menjalankan di komputer sendiri (development)

Prasyarat: Node.js 20+ dan npm.

```bash
# 1. Install dependencies
npm install

# 2. Salin file environment
cp .env.example .env
# lalu isi ANTHROPIC_API_KEY dan NEXTAUTH_SECRET di file .env
# (generate NEXTAUTH_SECRET acak, misal: openssl rand -base64 32)

# 3. Buat database & tabel (SQLite lokal)
npm run db:push

# 4. (opsional) isi data contoh/demo
npm run db:seed

# 5. Jalankan development server
npm run dev
```

Buka http://localhost:3000. Kalau habis `db:seed`, ada akun demo:
`demo@thesispilot.ai` / `password123`.

## Deploy ke Production (rekomendasi: Vercel + Neon Postgres)

Langkah ini yang paling cepat dan gratis untuk mulai, dan bisa langsung dipasangi domain
custom seperti `ai.easy.skripsita.com` (atau nama brand lain pilihanmu).

### 1. Siapkan database Postgres (gratis)

- Buat akun di [neon.tech](https://neon.tech) atau [supabase.com](https://supabase.com)
- Buat project baru, salin **connection string** (`postgresql://...`)
- Buka `prisma/schema.prisma`, ubah baris:
  ```prisma
  datasource db {
    provider = "postgresql"   // ganti dari "sqlite"
    url      = env("DATABASE_URL")
  }
  ```

### 2. Push kode ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# buat repo baru di GitHub, lalu:
git remote add origin <url-repo-kamu>
git push -u origin main
```

### 3. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → **New Project** → import repo GitHub kamu.
2. Di bagian **Environment Variables**, tambahkan:
   - `DATABASE_URL` → connection string Postgres dari langkah 1
   - `NEXTAUTH_SECRET` → string acak panjang (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` → URL production kamu, misal `https://ai.easy.skripsita.com`
   - `ANTHROPIC_API_KEY` → API key Claude kamu
   - `NEXT_PUBLIC_APP_NAME` → nama brand yang mau ditampilkan
3. Klik **Deploy**. Vercel otomatis menjalankan `npm run build`, yang di dalamnya sudah
   memanggil `prisma generate` (tidak akan bermasalah di Vercel karena Vercel punya akses
   internet penuh — beda dengan sandbox development ini).
4. Setelah deploy pertama sukses, jalankan migrasi skema ke database production:
   ```bash
   # dari komputer lokal, dengan DATABASE_URL production di .env
   npx prisma db push
   ```

### 4. Pasang domain custom

1. Di dashboard project Vercel → **Settings → Domains** → tambahkan domain, misal
   `ai.easy.skripsita.com` (harus domain yang kamu miliki/kontrol DNS-nya).
2. Vercel akan kasih instruksi record DNS (biasanya CNAME) untuk ditambahkan di pengaturan
   DNS domain kamu.
3. Tunggu propagasi DNS (biasanya beberapa menit sampai 1 jam), lalu domain akan aktif
   dengan HTTPS otomatis.

## Struktur Proyek

```
src/
  app/                    # halaman & API routes (App Router)
    page.tsx              # landing page
    pricing/page.tsx      # halaman harga
    login/ register/      # halaman auth
    dashboard/            # area setelah login (proyek skripsi)
    api/                  # route handlers (auth, projects, generate AI)
  components/             # komponen UI reusable
  lib/                    # helper: prisma client, auth options, AI client, konstanta
  types/                  # tipe TypeScript tambahan
prisma/
  schema.prisma           # skema database
  seed.ts                 # data contoh untuk development
```

## Catatan Etika Akademik

Platform ini dirancang untuk membantu mahasiswa membuat **draf awal**, bukan menggantikan
proses berpikir, riset, dan penulisan asli. Prompt AI di `src/lib/ai.ts` sudah diarahkan
untuk selalu memberi placeholder yang jelas pada bagian yang wajib diisi data/sumber asli,
dan tidak mengarang nama peneliti atau statistik seolah nyata. Tetap sarankan pengguna
untuk mengecek kebijakan penggunaan AI di kampus masing-masing sebelum mengumpulkan tugas
akhir.
