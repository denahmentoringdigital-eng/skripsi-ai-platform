import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  content: z.string().max(50000),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string; chapterId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, chapterId } = await context.params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Konten tidak valid." }, { status: 400 });
  }

  const project = await prisma.thesisProject.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  const chapter = await prisma.chapter.update({
    where: { id: chapterId },
    data: { content: parsed.data.content, status: "EDITED" },
  });

  return NextResponse.json({ chapter });
}
