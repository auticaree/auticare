import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string; professionalId: string }>;
}

// DELETE - Revoke access from a professional
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: childId, professionalId } = await params;

    // Verify parent owns this child profile
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { parentId: true, name: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to manage access for this child" },
        { status: 403 }
      );
    }

    // Revoke access
    const access = await prisma.childAccess.update({
      where: {
        childId_professionalId: {
          childId,
          professionalId,
        },
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: "ACCESS_REVOKED",
      targetType: "ChildAccess",
      targetId: access.id,
      metadata: {
        childId,
        professionalId,
      },
    });

    return NextResponse.json({
      message: "Access revoked successfully",
    });
  } catch (error) {
    console.error("Error revoking access:", error);
    return NextResponse.json(
      { error: "Failed to revoke access" },
      { status: 500 }
    );
  }
}
