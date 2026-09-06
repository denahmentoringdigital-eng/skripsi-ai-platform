import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@thesispilot.ai";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Demo user sudah ada, skip seeding.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      name: "Mahasiswa Demo",
      email,
      passwordHash,
      campus: "Universitas Contoh",
      major: "Manajemen",
      plan: "FREE",
    },
  });

  await prisma.thesisProject.create({
    data: {
      title: "Pengaruh Kualitas Layanan terhadap Kepuasan Pelanggan (Contoh)",
      topic: "Studi kasus pada pelanggan UMKM digital di Indonesia.",
      major: "Manajemen",
      citationFmt: "APA",
      userId: user.id,
      chapters: {
        create: [
          { number: 1, title: "Pendahuluan" },
          { number: 2, title: "Tinjauan Pustaka" },
          { number: 3, title: "Metodologi Penelitian" },
          { number: 4, title: "Hasil dan Pembahasan" },
          { number: 5, title: "Penutup" },
        ],
      },
    },
  });

  console.log(`Seed selesai. Login demo: ${email} / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
