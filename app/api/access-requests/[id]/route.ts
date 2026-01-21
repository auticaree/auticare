import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { sendAccessGrantedEmail, sendAccessRevokedEmail } from "@/lib/email";

// GET - Get a specific access request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            parentId: true,
            parent: { select: { name: true, email: true } }
          },
        },
        professional: {
          select: { id: true, name: true, email: true, role: true, licenseNumber: true },
        },
      },
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isParent = accessRequest.child.parentId === session.user.id;
    const isProfessional = accessRequest.professionalId === session.user.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isParent && !isProfessional && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ request: accessRequest });
  } catch (error) {
    console.error("Error fetching access request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Respond to an access request (approve/deny) - Parent only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, grantedScopes } = body;

    if (!action || !["APPROVED", "DENIED"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'APPROVED' or 'DENIED'" },
        { status: 400 }
      );
    }

    // Get the request and verify ownership
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        child: {
          select: { id: true, name: true, parentId: true },
        },
        professional: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only the parent can respond
    if (accessRequest.child.parentId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the parent can respond to access requests" },
        { status: 403 }
      );
    }

    // Check if already responded
    if (accessRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Update the request status
    const updatedRequest = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: action,
        respondedAt: new Date(),
        respondedBy: session.user.id,
      },
    });

    // If approved, create the ChildAccess record
    if (action === "APPROVED") {
      const scopesToGrant = grantedScopes || accessRequest.requestedScopes;

      await prisma.childAccess.create({
        data: {
          childId: accessRequest.childId,
          professionalId: accessRequest.professionalId,
          scopes: scopesToGrant,
        },
      });

      // Send email notification
      await sendAccessGrantedEmail({
        recipientEmail: accessRequest.professional.email,
        recipientName: accessRequest.professional.name,
        senderName: session.user.name,
        childName: accessRequest.child.name,
        scopes: scopesToGrant,
      });

      // Audit log
      await createAuditLog({
        userId: session.user.id,
        action: "ACCESS_GRANTED",
        targetType: "AccessRequest",
        targetId: id,
        metadata: {
          childId: accessRequest.childId,
          professionalId: accessRequest.professionalId,
          childName: accessRequest.child.name,
          professionalName: accessRequest.professional.name,
          grantedScopes: scopesToGrant,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Access granted to ${accessRequest.professional.name}`,
        request: updatedRequest,
      });
    }

    // If denied, send notification
    await sendAccessRevokedEmail({
      recipientEmail: accessRequest.professional.email,
      recipientName: accessRequest.professional.name,
      childName: accessRequest.child.name,
    });

    // Audit log for denial
    await createAuditLog({
      userId: session.user.id,
      action: "INVITE_DENIED",
      targetType: "AccessRequest",
      targetId: id,
      metadata: {
        childId: accessRequest.childId,
        professionalId: accessRequest.professionalId,
        childName: accessRequest.child.name,
        professionalName: accessRequest.professional.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Access request denied`,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("Error responding to access request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Cancel an access request (professional only - their own request)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
      select: { id: true, professionalId: true, status: true },
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Only the professional who created it can cancel
    if (accessRequest.professionalId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only cancel your own requests" },
        { status: 403 }
      );
    }

    // Can only cancel pending requests
    if (accessRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Can only cancel pending requests" },
        { status: 400 }
      );
    }

    await prisma.accessRequest.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Request cancelled" });
  } catch (error) {
    console.error("Error cancelling access request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
