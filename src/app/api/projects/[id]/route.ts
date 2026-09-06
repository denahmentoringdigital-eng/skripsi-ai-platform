import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const project = await prisma.thesisProject.findFirst({
    where: { id, userId: session.user.id },
    include: {
      chapters: { orderBy: { number: "asc" } },
      references: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const project = await prisma.thesisProject.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
  }

  await prisma.thesisProject.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
