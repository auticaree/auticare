import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import RoutineSequenceClient from "./routine-sequence-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Routine Sequence Game Page
 * Game 3 from Auti-2.md - Routine understanding and sequencing
 * 
 * Routines: Morning, Bedtime, School preparation
 * Gameplay: Drag and drop cards to order daily activities
 */
export default async function RoutineSequencePage({ params }: PageProps) {
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

  return <RoutineSequenceClient childId={child.id} childName={displayName} />;
}
