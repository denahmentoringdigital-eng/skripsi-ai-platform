import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectDetailClient from "@/components/ProjectDetailClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const project = await prisma.thesisProject.findFirst({
    where: { id, userId: session.user.id },
    include: {
      chapters: { orderBy: { number: "asc" } },
      references: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) {
    notFound();
  }

  const serialized = {
    id: project.id,
    title: project.title,
    topic: project.topic,
    major: project.major,
    citationFmt: project.citationFmt,
    userId: project.userId,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    chapters: project.chapters.map((c) => ({
      id: c.id,
      number: c.number,
      title: c.title,
      content: c.content,
      status: c.status,
      projectId: c.projectId,
    })),
    references: project.references.map((r) => ({
      id: r.id,
      authors: r.authors,
      year: r.year,
      title: r.title,
      source: r.source,
      formatted: r.formatted,
      projectId: r.projectId,
    })),
  };

  return <ProjectDetailClient project={serialized} />;
}
