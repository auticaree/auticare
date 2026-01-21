import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bonusSchema = z.object({
  amount: z.number().min(1).max(100),
  reason: z.string().optional(),
});

// POST /api/garden/[id]/bonus - Award bonus XP (for games, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get garden and verify access
    const garden = await prisma.gardenProgress.findUnique({
      where: { id },
      include: {
        child: true,
      },
    });

    if (!garden) {
      return NextResponse.json({ error: "Garden not found" }, { status: 404 });
    }

    // Check access: Must be the parent or the child
    const isParent =
      session.user.role === "PARENT" &&
      garden.child.parentId === session.user.id;
    const isChild =
      session.user.role === "CHILD" &&
      garden.child.userId === session.user.id;

    if (!isParent && !isChild) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const result = bonusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { amount } = result.data;

    // Calculate new experience and check for level up
    const newExperience = garden.growthPoints + amount;
    const expForNextLevel = garden.totalPoints;

    let newLevel = garden.plantLevel;
    let remainingExp = newExperience;

    // Handle potential level up
    if (newExperience >= expForNextLevel) {
      newLevel = garden.plantLevel + 1;
      remainingExp = newExperience - expForNextLevel;
    }

    // Update garden
    const updatedGarden = await prisma.gardenProgress.update({
      where: { id },
      data: {
        growthPoints: remainingExp,
        plantLevel: newLevel,
      },
    });

    // Calculate growth percentage
    const growthPercentage = Math.min(
      100,
      Math.round((updatedGarden.growthPoints / updatedGarden.totalPoints) * 100)
    );

    return NextResponse.json({
      success: true,
      experience: updatedGarden.growthPoints,
      level: updatedGarden.plantLevel,
      growthPercentage,
      leveledUp: newLevel > garden.plantLevel,
      xpAwarded: amount,
    });
  } catch (error) {
    console.error("Error awarding bonus XP:", error);
    return NextResponse.json(
      { error: "Failed to award bonus XP" },
      { status: 500 }
    );
  }
}
