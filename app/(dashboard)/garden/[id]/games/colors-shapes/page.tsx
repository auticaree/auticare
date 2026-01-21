import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import ColorsShapesClient from "./colors-shapes-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Colors & Shapes Game Page
 * Game 2 from Auti-2.md - Color and shape recognition
 * 
 * Modes: Colors only, Shapes only, Combined
 * Colors: Red, Blue, Green, Yellow
 * Shapes: Circle, Square, Triangle, Star
 */
export default async function ColorsShapesPage({ params }: PageProps) {
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

  return <ColorsShapesClient childId={child.id} childName={displayName} />;
}
