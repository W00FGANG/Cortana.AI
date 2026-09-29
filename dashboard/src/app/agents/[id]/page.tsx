import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyAgentRedirectPage({ params }: PageProps) {
  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: {
      OR: [
        { id: id },
        { name: { equals: id, mode: "insensitive" } },
      ],
    },
    select: { name: true },
  });

  if (!agent) {
    notFound();
  }

  redirect(`/${agent.name.toLowerCase()}`);
}
