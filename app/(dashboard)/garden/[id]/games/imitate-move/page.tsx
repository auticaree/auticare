import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import ImitateMoveClient from "./imitate-move-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Imitate the Move Game Page
 * Game 5 from Auti-2.md - Motor imitation and body awareness
 * 
 * Movements: Clapping, Waving, Arms up, Jumping, Touching nose, Spinning
 * Features: Animated character demonstration, optional physical imitation phase
 */
export default async function ImitateMovePage({ params }: PageProps) {
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

  return <ImitateMoveClient childId={child.id} childName={displayName} />;
}
