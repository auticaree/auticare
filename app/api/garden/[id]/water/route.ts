import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: gardenId } = await params;

    // Find the garden
    const garden = await prisma.gardenProgress.findUnique({
      where: { id: gardenId },
      include: {
        child: { select: { id: true, parentId: true } },
      },
    });

    if (!garden) {
      return NextResponse.json({ error: "Garden not found" }, { status: 404 });
    }

    // Verify access
    const userRole = session.user.role as Role;
    const isParent = userRole === Role.PARENT && garden.child.parentId === session.user.id;
    // ChildProfile doesn't have userId, so CHILD role access needs different logic
    const isChild = false; // Disable child access for now
    const isAdmin = userRole === Role.ADMIN;

    if (!isParent && !isChild && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check cooldown (can water once per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (garden.lastWatered && garden.lastWatered > oneHourAgo) {
      const minutesUntilNext = Math.ceil(
        (garden.lastWatered.getTime() + 60 * 60 * 1000 - Date.now()) / 60000
      );
      return NextResponse.json(
        { error: `Wait ${minutesUntilNext} minutes before watering again` },
        { status: 429 }
      );
    }

    // Add points for watering
    const waterPoints = 5;
    const newGrowthPoints = garden.growthPoints + waterPoints;
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
        lastWatered: new Date(),
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
    });
  } catch (error) {
    console.error("Error watering garden:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
