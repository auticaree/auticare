import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string; taskId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: gardenId, taskId } = await params;

    // Find the garden and task
    const [garden, task] = await Promise.all([
      prisma.gardenProgress.findUnique({
        where: { id: gardenId },
        include: {
          child: { select: { id: true, parentId: true } },
        },
      }),
      prisma.gardenTask.findUnique({
        where: { id: taskId },
      }),
    ]);

    if (!garden) {
      return NextResponse.json({ error: "Garden not found" }, { status: 404 });
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify task belongs to this garden
    if (task.gardenId !== gardenId) {
      return NextResponse.json({ error: "Task mismatch" }, { status: 400 });
    }

    // Verify access
    const userRole = session.user.role as Role;
    const isParent = userRole === Role.PARENT && garden.child.parentId === session.user.id;
    // ChildProfile doesn't have userId, so CHILD role access needs different logic
    const isChild = false;
    const isAdmin = userRole === Role.ADMIN;

    if (!isParent && !isChild && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already completed
    if (task.completedAt) {
      return NextResponse.json(
        { error: "Task already completed" },
        { status: 400 }
      );
    }

    // Complete the task
    await prisma.gardenTask.update({
      where: { id: taskId },
      data: { completedAt: new Date() },
    });

    // Add points (using schema field names)
    const newGrowthPoints = garden.growthPoints + task.points;
    const pointsForNextLevel = garden.totalPoints;

    let newLevel = garden.plantLevel;
    let finalGrowthPoints = newGrowthPoints;
    let tasksCompleted = garden.tasksCompleted;

    // Level up if enough points
    if (newGrowthPoints >= pointsForNextLevel) {
      newLevel = garden.plantLevel + 1;
      finalGrowthPoints = newGrowthPoints - pointsForNextLevel;
      tasksCompleted = garden.tasksCompleted + 1;
    }

    // Update garden
    const updatedGarden = await prisma.gardenProgress.update({
      where: { id: gardenId },
      data: {
        growthPoints: finalGrowthPoints,
        plantLevel: newLevel,
        tasksCompleted,
      },
    });

    const growthPercentage = Math.min(
      Math.round((finalGrowthPoints / updatedGarden.totalPoints) * 100),
      100
    );

    return NextResponse.json({
      success: true,
      growthPoints: finalGrowthPoints,
      level: newLevel,
      growthPercentage,
      tasksCompleted,
      leveledUp: newLevel > garden.plantLevel,
      pointsGained: task.points,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
