import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHAPTER_TEMPLATE } from "@/lib/constants";

const createProjectSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter").max(300),
  topic: z.string().min(5, "Topik minimal 5 karakter").max(1000),
  major: z.string().min(2).max(150),
  citationFmt: z.string().min(2).max(50).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.thesisProject.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { chapters: true },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Data tidak valid.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { title, topic, major, citationFmt } = parsed.data;

  const project = await prisma.thesisProject.create({
    data: {
      title,
      topic,
      major,
      citationFmt: citationFmt || "APA",
      userId: session.user.id,
      chapters: {
        create: CHAPTER_TEMPLATE.map((c) => ({ number: c.number, title: c.title })),
      },
    },
    include: { chapters: true },
  });

  return NextResponse.json({ project }, { status: 201 });
}
