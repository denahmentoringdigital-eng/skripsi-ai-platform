import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChapterDraft } from "@/lib/ai";
import { PLAN_LIMITS } from "@/lib/constants";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string; chapterId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, chapterId } = await context.params;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 });
  }

  const planKey = user.plan as keyof typeof PLAN_LIMITS;
  const limit = PLAN_LIMITS[planKey].monthlyCredits;
  if (user.aiCreditsUsed >= limit) {
    return NextResponse.json(
      {
        error: `Jatah generate AI paket ${PLAN_LIMITS[planKey].label} kamu sudah habis (${limit}x). Upgrade paket untuk melanjutkan.`,
      },
      { status: 403 }
    );
  }

  const project = await prisma.thesisProject.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, projectId: project.id },
  });
  if (!chapter) {
    return NextResponse.json({ error: "Bab tidak ditemukan." }, { status: 404 });
  }

  await prisma.chapter.update({ where: { id: chapter.id }, data: { status: "DRAFTING" } });

  try {
    const draft = await generateChapterDraft({
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      thesisTitle: project.title,
      topic: project.topic,
      major: project.major,
      citationFormat: project.citationFmt,
    });

    const [updatedChapter] = await prisma.$transaction([
      prisma.chapter.update({
        where: { id: chapter.id },
        data: { content: draft, status: "DRAFTED" },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { aiCreditsUsed: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ chapter: updatedChapter });
  } catch (err) {
    await prisma.chapter.update({ where: { id: chapter.id }, data: { status: "EMPTY" } });
    const message = err instanceof Error ? err.message : "Gagal generate draf. Coba lagi.";
    console.error("Generate chapter error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
