import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accessInviteSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { sendInviteEmail, sendAccessGrantedEmail } from "@/lib/email";
import { Role, PermissionScope } from "@prisma/client";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST - Send invitation to a professional
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: childId } = await params;

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
        { error: "You don't have permission to invite members for this child" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, scopes } = body;

    if (!email || !scopes || scopes.length === 0) {
      return NextResponse.json(
        { error: "Email and at least one permission scope are required" },
        { status: 400 }
      );
    }

    // Check if professional exists
    const professional = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, name: true },
    });

    if (professional) {
      // Professional exists - check if they're a valid professional role
      if (professional.role !== Role.CLINICIAN && professional.role !== Role.SUPPORT) {
        return NextResponse.json(
          { error: "This email belongs to a non-professional account" },
          { status: 400 }
        );
      }

      // Check if access already exists
      const existingAccess = await prisma.childAccess.findUnique({
        where: {
          childId_professionalId: {
            childId,
            professionalId: professional.id,
          },
        },
      });

      if (existingAccess?.isActive) {
        return NextResponse.json(
          { error: "This professional already has access" },
          { status: 409 }
        );
      }

      // Grant or reactivate access directly
      const access = await prisma.childAccess.upsert({
        where: {
          childId_professionalId: {
            childId,
            professionalId: professional.id,
          },
        },
        update: {
          scopes: scopes as PermissionScope[],
          isActive: true,
          revokedAt: null,
        },
        create: {
          childId,
          professionalId: professional.id,
          scopes: scopes as PermissionScope[],
        },
      });

      // Create audit log
      await createAuditLog({
        userId: session.user.id!,
        action: "ACCESS_GRANTED",
        targetType: "ChildAccess",
        targetId: access.id,
        metadata: {
          childId,
          professionalId: professional.id,
          professionalEmail: email,
          scopes,
        },
      });

      // Send notification email to professional
      await sendAccessGrantedEmail({
        recipientEmail: email,
        recipientName: professional.name || email,
        senderName: session.user.name || "A parent",
        childName: child.name,
        scopes,
      });

      return NextResponse.json({
        message: "Access granted successfully",
        access,
      });
    }

    // Professional doesn't exist - create invitation
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.accessInvite.create({
      data: {
        childId,
        recipientEmail: email,
        scopes: scopes as PermissionScope[],
        token,
        expiresAt,
        senderId: session.user.id!,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: "INVITE_SENT",
      targetType: "AccessInvite",
      targetId: invite.id,
      metadata: {
        childId,
        recipientEmail: email,
        scopes,
      },
    });

    // Send invitation email
    await sendInviteEmail({
      recipientEmail: email,
      senderName: session.user.name || "A parent",
      childName: child.name,
      inviteToken: token,
      scopes,
      expiresAt,
    });

    return NextResponse.json({
      message: "Invitation sent successfully",
      invite: {
        id: invite.id,
        email: invite.recipientEmail,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
