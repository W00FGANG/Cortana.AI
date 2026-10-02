import { prisma } from "@/lib/prisma";
import { SettingsClient } from "@/components/SettingsClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings — Corvana.AI",
  description: "Configure your Corvana.AI workspace, AI voice assistant, automation triggers, and integration preferences.",
};

export default async function SettingsPage() {
  const agents = await prisma.agent.findMany({
    where: { status: "Active" },
    select: {
      id: true,
      name: true,
      role: true,
      avatar: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return <SettingsClient agents={agents} />;
}
