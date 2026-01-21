import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import SoundMatchClient from "./sound-match-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Sound Match Game Page
 * Game 4 from Auti-2.md - Sound identification and matching
 * 
 * Categories: Animals, Nature, Everyday sounds
 * Features: Audio playback with volume control, gentle sounds
 */
export default async function SoundMatchPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: childId } = await params;
  const userRole = session.user.role as Role;

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { id: true, name: true, preferredName: true, parentId: true },
  });

  if (!child) notFound();

  const isParent = userRole === Role.PARENT && child.parentId === session.user.id;
  const isAdmin = userRole === Role.ADMIN;

  if (!isParent && !isAdmin) {
    redirect("/dashboard");
  }

  const displayName = child.preferredName || child.name.split(" ")[0];

  return <SoundMatchClient childId={child.id} childName={displayName} />;
}
