import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  taskType: z.string().min(1).max(50),
  icon: z.string().min(1).max(50),
  points: z.number().min(1).max(100).default(10),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: childId } = await params;
    const body = await request.json();
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Verify access to child
    const child = await prisma.childProfile.findFirst({
      where: {
        id: childId,
        OR: [
          { parentId: session.user.id },
          {
            accessList: {
              some: {
                professionalId: session.user.id,
                isActive: true,
              },
            },
          },
        ],
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 404 }
      );
    }

    // Get or create garden progress
    let gardenProgress = await prisma.gardenProgress.findUnique({
      where: { childId },
    });

    if (!gardenProgress) {
      gardenProgress = await prisma.gardenProgress.create({
        data: {
          childId,
          plantLevel: 1,
          growthPoints: 0,
          totalPoints: 100,
          tasksCompleted: 0,
        },
      });
    }

    const { title, taskType, icon, points } = validation.data;

    const task = await prisma.gardenTask.create({
      data: {
        gardenId: gardenProgress.id,
        title,
        taskType,
        icon,
        points,
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: AuditAction.RECORD_CREATED,
      targetType: "GardenTask",
      targetId: task.id,
      metadata: { childId, title, points },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating garden task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: childId } = await params;

    // Verify access to child
    const child = await prisma.childProfile.findFirst({
      where: {
        id: childId,
        OR: [
          { parentId: session.user.id },
          {
            accessList: {
              some: {
                professionalId: session.user.id,
                isActive: true,
              },
            },
          },
        ],
      },
    });

    if (!child) {
      return NextResponse.json(
        { error: "Child not found or access denied" },
        { status: 404 }
      );
    }

    const gardenProgress = await prisma.gardenProgress.findUnique({
      where: { childId },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      tasks: gardenProgress?.tasks || [],
    });
  } catch (error) {
    console.error("Error fetching garden tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
