import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY belum diset. Tambahkan API key Anthropic (Claude) di file .env untuk mengaktifkan fitur generate AI."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const CHAPTER_GUIDANCE: Record<number, string> = {
  1: `BAB I PENDAHULUAN. Wajib memuat sub-bab: (1) Latar Belakang Masalah (data/fenomena pendukung, gap penelitian), (2) Rumusan Masalah (dalam bentuk poin/pertanyaan penelitian), (3) Tujuan Penelitian, (4) Manfaat Penelitian (teoritis & praktis), (5) Batasan/Ruang Lingkup Penelitian.`,
  2: `BAB II TINJAUAN PUSTAKA. Wajib memuat: (1) Landasan teori untuk setiap variabel penelitian, (2) Penelitian terdahulu yang relevan (ringkas dalam bentuk naratif, sebutkan nama peneliti & tahun secara generik seperti "(Peneliti, Tahun)" karena ini draf awal), (3) Kerangka pemikiran / model penelitian, (4) Hipotesis penelitian jika relevan dengan jenis penelitian kuantitatif.`,
  3: `BAB III METODOLOGI PENELITIAN. Wajib memuat: (1) Jenis dan Desain Penelitian, (2) Populasi dan Sampel / Subjek Penelitian, (3) Teknik Pengumpulan Data, (4) Definisi Operasional Variabel (jika ada), (5) Teknik Analisis Data.`,
  4: `BAB IV HASIL DAN PEMBAHASAN. Karena ini draf awal sebelum data riil dikumpulkan, buat KERANGKA/TEMPLATE bab ini: (1) Gambaran Umum Objek Penelitian (placeholder), (2) Struktur penyajian hasil analisis data (placeholder tabel/temuan yang perlu diisi peneliti), (3) Struktur pembahasan yang mengaitkan hasil dengan teori di BAB II. Beri catatan jelas bagian mana yang HARUS diisi mahasiswa dengan data asli.`,
  5: `BAB V PENUTUP. Wajib memuat: (1) Kesimpulan (ringkas, menjawab rumusan masalah), (2) Keterbatasan Penelitian, (3) Saran (untuk penelitian selanjutnya & praktis).`,
};

export interface GenerateChapterInput {
  chapterNumber: number;
  chapterTitle: string;
  thesisTitle: string;
  topic: string;
  major: string;
  citationFormat: string;
}

export async function generateChapterDraft(input: GenerateChapterInput): Promise<string> {
  const guidance = CHAPTER_GUIDANCE[input.chapterNumber] || `Bab berjudul "${input.chapterTitle}".`;

  const systemPrompt = `Kamu adalah asisten akademik yang membantu mahasiswa Indonesia menyusun DRAF AWAL skripsi/tugas akhir.
Tulis dalam Bahasa Indonesia baku/formal akademik, gaya penulisan ilmiah.
Ini adalah DRAF untuk membantu mahasiswa mulai menulis, BUKAN karya final yang boleh langsung dikumpulkan tanpa revisi.
Selalu ingatkan (secara implisit lewat placeholder yang jelas, misal "[isi dengan data/kutipan asli]") bahwa mahasiswa WAJIB:
- Mengganti semua contoh sitasi generik dengan sumber nyata dan sitasi yang benar.
- Memverifikasi semua klaim/data dengan sumber primer.
- Menyesuaikan dengan pedoman penulisan skripsi kampus masing-masing.
Jangan mengarang nama peneliti, judul jurnal, atau statistik spesifik seolah itu nyata — gunakan placeholder yang jelas jika perlu contoh.
Format keluaran memakai heading markdown (##, ###) dan paragraf, TANPA basa-basi pembuka/penutup di luar isi bab.`;

  const userPrompt = `Buatkan draf ${guidance}

Detail penelitian:
- Judul skripsi: ${input.thesisTitle}
- Topik/fokus penelitian: ${input.topic}
- Program studi/jurusan: ${input.major}
- Format sitasi yang dipakai kampus: ${input.citationFormat}

Tulis draf bab ini selengkap mungkin (target 600-1000 kata), terstruktur dengan sub-heading, siap dijadikan starting point untuk ditulis ulang/disempurnakan mahasiswa.`;

  const anthropic = getClient();
  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
  } catch (err) {
    // Detail asli tetap tercatat di log server (Vercel), tapi user hanya melihat
    // pesan ramah -- bukan JSON mentah dari Anthropic.
    console.error("Anthropic API error:", err);
    if (err instanceof Anthropic.APIError) {
      const raw = String(err.message || "").toLowerCase();
      if (raw.includes("credit balance")) {
        throw new Error(
          "Layanan AI sedang tidak tersedia sementara (kuota layanan habis). Jatah generate kamu tidak terpakai. Silakan coba lagi nanti atau hubungi admin."
        );
      }
      if (err.status === 401) {
        throw new Error("Layanan AI belum terkonfigurasi dengan benar. Silakan hubungi admin.");
      }
      if (err.status === 429) {
        throw new Error("Layanan AI sedang sibuk. Tunggu sebentar lalu coba generate lagi.");
      }
    }
    throw new Error("Gagal generate draf. Coba lagi beberapa saat.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI tidak mengembalikan hasil teks. Coba lagi.");
  }
  return textBlock.text.trim();
}
