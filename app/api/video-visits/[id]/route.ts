import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { Role, VisitStatus } from "@prisma/client";

// GET - Get a specific video visit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const visit = await prisma.videoVisit.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, parentId: true },
        },
        host: {
          select: { id: true, name: true, role: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check access
    const userRole = session.user.role as Role;
    const isHost = visit.hostId === session.user.id;
    const isParent = visit.child.parentId === session.user.id;
    const isParticipant = visit.participants.some(
      (p) => p.userId === session.user.id
    );
    const isAdmin = userRole === Role.ADMIN;

    if (!isHost && !isParent && !isParticipant && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ visit });
  } catch (error) {
    console.error("Error fetching video visit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update video visit (status, notes, reschedule)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, scheduledAt, title, reason } = body;

    const visit = await prisma.videoVisit.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, parentId: true },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check authorization
    const userRole = session.user.role as Role;
    const isHost = visit.hostId === session.user.id;
    const isParent = visit.child.parentId === session.user.id;
    const isAdmin = userRole === Role.ADMIN;

    if (!isHost && !isParent && !isAdmin) {
      return NextResponse.json(
        { error: "Only the host, parent, or admin can update visits" },
        { status: 403 }
      );
    }

    // Validate status transition
    if (status) {
      const validStatuses: VisitStatus[] = [
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }

      // Prevent invalid transitions
      if (visit.status === "COMPLETED" && status !== "COMPLETED") {
        return NextResponse.json(
          { error: "Cannot change status of completed visits" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;

      // Set timestamps based on status
      if (status === "IN_PROGRESS" && !visit.startedAt) {
        updateData.startedAt = new Date();
      }
      if (
        status === "COMPLETED" ||
        status === "CANCELLED" ||
        status === "NO_SHOW"
      ) {
        updateData.endedAt = new Date();
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (reason !== undefined) {
      updateData.reason = reason;
    }

    const updatedVisit = await prisma.videoVisit.update({
      where: { id },
      data: updateData,
      include: {
        child: { select: { id: true, name: true } },
        host: { select: { id: true, name: true } },
      },
    });

    // Audit log
    if (status) {
      await createAuditLog({
        action:
          status === "COMPLETED" ? "VIDEO_SESSION_ENDED" : "RECORD_UPDATED",
        userId: session.user.id,
        targetId: id,
        targetType: "VideoVisit",
        metadata: {
          previousStatus: visit.status,
          newStatus: status,
          childName: visit.child.name,
        },
      });
    }

    return NextResponse.json({
      success: true,
      visit: updatedVisit,
      message: status
        ? `Visit marked as ${status.toLowerCase().replace("_", " ")}`
        : "Visit updated successfully",
    });
  } catch (error) {
    console.error("Error updating video visit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a video visit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const visit = await prisma.videoVisit.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, parentId: true },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    // Check authorization
    const userRole = session.user.role as Role;
    const isHost = visit.hostId === session.user.id;
    const isParent = visit.child.parentId === session.user.id;
    const isAdmin = userRole === Role.ADMIN;

    if (!isHost && !isParent && !isAdmin) {
      return NextResponse.json(
        { error: "Only the host, parent, or admin can cancel visits" },
        { status: 403 }
      );
    }

    // Can only cancel scheduled visits
    if (visit.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "Can only cancel scheduled visits" },
        { status: 400 }
      );
    }

    // Mark as cancelled instead of deleting
    await prisma.videoVisit.update({
      where: { id },
      data: {
        status: "CANCELLED",
        endedAt: new Date(),
      },
    });

    // Audit log
    await createAuditLog({
      action: "RECORD_DELETED",
      userId: session.user.id,
      targetId: id,
      targetType: "VideoVisit",
      metadata: {
        childName: visit.child.name,
        title: visit.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Visit cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling video visit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
