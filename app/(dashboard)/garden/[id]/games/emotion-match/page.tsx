import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import EmotionMatchClient from "./emotion-match-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Emotion Match Game Page
 * Game 1 from Auti-2.md - Emotion recognition
 * 
 * Objective: Emotion recognition
 * Gameplay: The app shows a facial expression and the child selects the matching emotion
 * Emotions: Happy, Sad, Angry, Surprised
 * Feedback: Positive animation for correct; neutral retry for incorrect
 */
export default async function EmotionMatchPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: childId } = await params;
  const userRole = session.user.role as Role;

  // Get child profile
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { id: true, name: true, preferredName: true, parentId: true },
  });

  if (!child) notFound();

  // Verify access
  const isParent = userRole === Role.PARENT && child.parentId === session.user.id;
  const isAdmin = userRole === Role.ADMIN;

  if (!isParent && !isAdmin) {
    redirect("/dashboard");
  }

  const displayName = child.preferredName || child.name.split(" ")[0];

  return (
    <EmotionMatchClient
      childId={child.id}
      childName={displayName}
    />
  );
}
