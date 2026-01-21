import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { videoVisitSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const status = searchParams.get("status");

    let whereClause = {};

    if (userRole === Role.PARENT) {
      // Parents can see visits for their children
      const children = await prisma.childProfile.findMany({
        where: { parentId: session.user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      whereClause = { childId: { in: childIds } };
    } else if (userRole === Role.CLINICIAN || userRole === Role.SUPPORT) {
      // Professionals can see their visits (as host)
      whereClause = { hostId: session.user.id };
    }
    // Admins can see all

    if (childId) {
      whereClause = { ...whereClause, childId };
    }

    if (status) {
      whereClause = { ...whereClause, status };
    }

    const visits = await prisma.videoVisit.findMany({
      where: whereClause,
      include: {
        child: { select: { id: true, name: true } },
        host: { select: { id: true, name: true, role: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json({ visits });
  } catch (error) {
    console.error("Error fetching video visits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    const body = await request.json();
    const validation = videoVisitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { childId, title, reason, scheduledAt, participantIds } = validation.data;

    // Verify access to child
    if (userRole === Role.PARENT) {
      const child = await prisma.childProfile.findFirst({
        where: { id: childId, parentId: session.user.id },
      });
      if (!child) {
        return NextResponse.json(
          { error: "Child not found or access denied" },
          { status: 403 }
        );
      }
    } else if (userRole === Role.CLINICIAN || userRole === Role.SUPPORT) {
      const hasAccess = await prisma.childAccess.findFirst({
        where: {
          childId,
          professionalId: session.user.id,
          isActive: true,
        },
      });
      if (!hasAccess) {
        return NextResponse.json(
          { error: "You don't have access to this patient" },
          { status: 403 }
        );
      }
    }

    // Generate room name
    const roomName = `auticare-${childId.slice(0, 8)}-${Date.now()}`;

    // Create visit - current user is the host
    const visit = await prisma.videoVisit.create({
      data: {
        childId,
        hostId: session.user.id,
        title,
        reason,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        roomName,
        status: "SCHEDULED",
        participants: {
          create: participantIds.map(userId => ({
            userId,
          })),
        },
      },
      include: {
        child: { select: { id: true, name: true } },
        host: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await createAuditLog({
      action: "VIDEO_SESSION_CREATED",
      userId: session.user.id,
      targetId: visit.id,
      targetType: "VideoVisit",
      metadata: { childId, title, scheduledAt },
    });

    return NextResponse.json({ visit }, { status: 201 });
  } catch (error) {
    console.error("Error creating video visit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
