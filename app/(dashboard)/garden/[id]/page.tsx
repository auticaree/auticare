import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import GardenClient from "./garden-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChildGardenPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: childId } = await params;
  const userRole = session.user.role as Role;

  // Get child profile with garden progress
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    include: {
      parent: { select: { id: true, name: true } },
      gardenProgress: {
        include: {
          tasks: {
            where: { completedAt: null },
            orderBy: { createdAt: "asc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!child) notFound();

  // Verify access - ChildProfile doesn't have userId, check parent
  const isParent = userRole === Role.PARENT && child.parentId === session.user.id;
  // CHILD role would need a different way to link - for now just check parent access
  const isChild = false; // ChildProfile doesn't have userId field

  let isProfessional = false;
  if (userRole === Role.CLINICIAN || userRole === Role.SUPPORT) {
    const access = await prisma.childAccess.findFirst({
      where: {
        childId,
        professionalId: session.user.id,
        isActive: true,
      },
    });
    isProfessional = !!access;
  }

  const isAdmin = userRole === Role.ADMIN;

  if (!isParent && !isChild && !isProfessional && !isAdmin) {
    redirect("/dashboard");
  }

  // Get or create garden progress
  let gardenProgress = child.gardenProgress;
  if (!gardenProgress) {
    gardenProgress = await prisma.gardenProgress.create({
      data: {
        childId,
        plantLevel: 1,
        growthPoints: 0,
        totalPoints: 100,
        tasksCompleted: 0,
      },
      include: {
        tasks: {
          where: { completedAt: null },
          orderBy: { createdAt: "asc" },
          take: 10,
        },
      },
    });
  }

  // Calculate growth percentage
  const growthPercentage = Math.min(
    Math.round((gardenProgress.growthPoints / gardenProgress.totalPoints) * 100),
    100
  );

  // Get plant phase based on growth points
  const getPlantPhase = (points: number, totalPoints: number) => {
    const percentage = (points / totalPoints) * 100;
    if (percentage < 25) return "Seedling";
    if (percentage < 50) return "Sprouting";
    if (percentage < 75) return "Growing";
    if (percentage < 100) return "Blooming";
    return "Ready to Harvest";
  };

  const plantPhase = getPlantPhase(gardenProgress.growthPoints, gardenProgress.totalPoints);

  // Get recent completed tasks for history
  const completedTasks = await prisma.gardenTask.findMany({
    where: { gardenId: gardenProgress.id, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 5,
  });

  return (
    <GardenClient
      child={{
        id: child.id,
        name: child.name,
        preferredName: child.name, // Use name as preferredName since field doesn't exist
      }}
      garden={{
        id: gardenProgress.id,
        level: gardenProgress.plantLevel,
        experience: gardenProgress.growthPoints,
        currentPlant: "plant", // Schema doesn't have currentPlant
        plantsGrown: gardenProgress.tasksCompleted,
        lastWatered: gardenProgress.lastWatered,
      }}
      growthPercentage={growthPercentage}
      plantPhase={plantPhase}
      pendingTasks={gardenProgress.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.taskType, // Use taskType as description
        icon: t.icon,
        experienceReward: t.points,
        category: t.taskType,
      }))}
      completedTasks={completedTasks.map((t) => ({
        id: t.id,
        title: t.title,
        completedAt: t.completedAt!.toISOString(),
      }))}
      isChildMode={isChild}
      isParent={isParent}
    />
  );
}
