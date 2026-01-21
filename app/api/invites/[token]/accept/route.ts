import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
    params: Promise<{ token: string }>;
}

// POST - Accept an invitation
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = await params;

        // Find the invitation
        const invite = await prisma.accessInvite.findUnique({
            where: { token },
            include: {
                child: {
                    select: { id: true, name: true, parentId: true },
                },
                sender: {
                    select: { name: true },
                },
            },
        });

        if (!invite) {
            return NextResponse.json(
                { error: "Invitation not found" },
                { status: 404 }
            );
        }

        // Check if expired
        if (invite.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "This invitation has expired" },
                { status: 410 }
            );
        }

        // Check if already responded
        if (invite.status !== "PENDING") {
            return NextResponse.json(
                { error: `This invitation has already been ${invite.status.toLowerCase()}` },
                { status: 400 }
            );
        }

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, role: true, name: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Verify user is a professional
        if (user.role !== "CLINICIAN" && user.role !== "SUPPORT") {
            return NextResponse.json(
                { error: "Only healthcare professionals can accept care team invitations" },
                { status: 403 }
            );
        }

        // If invite was sent to specific email, verify it matches
        if (invite.recipientEmail && invite.recipientEmail !== user.email) {
            return NextResponse.json(
                { error: "This invitation was sent to a different email address" },
                { status: 403 }
            );
        }

        // Check if access already exists
        const existingAccess = await prisma.childAccess.findUnique({
            where: {
                childId_professionalId: {
                    childId: invite.childId,
                    professionalId: user.id,
                },
            },
        });

        // Use transaction to update invite and create access
        await prisma.$transaction(async (tx) => {
            // Update invite status
            await tx.accessInvite.update({
                where: { id: invite.id },
                data: {
                    status: "ACCEPTED",
                    respondedAt: new Date(),
                    recipientId: user.id,
                },
            });

            // Create or reactivate access
            if (existingAccess) {
                await tx.childAccess.update({
                    where: { id: existingAccess.id },
                    data: {
                        scopes: invite.scopes,
                        isActive: true,
                        revokedAt: null,
                    },
                });
            } else {
                await tx.childAccess.create({
                    data: {
                        childId: invite.childId,
                        professionalId: user.id,
                        scopes: invite.scopes,
                    },
                });
            }
        });

        // Create audit log
        await createAuditLog({
            userId: user.id,
            action: "INVITE_ACCEPTED",
            targetType: "AccessInvite",
            targetId: invite.id,
            metadata: {
                childId: invite.childId,
                childName: invite.child.name,
                scopes: invite.scopes,
                invitedBy: invite.sender.name,
            },
        });

        return NextResponse.json({
            message: "Invitation accepted successfully",
            childId: invite.childId,
        });
    } catch (error) {
        console.error("Error accepting invitation:", error);
        return NextResponse.json(
            { error: "Failed to accept invitation" },
            { status: 500 }
        );
    }
}
