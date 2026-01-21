import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

interface RouteParams {
    params: Promise<{ token: string }>;
}

// POST - Decline an invitation
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
            select: { id: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If invite was sent to specific email, verify it matches
        if (invite.recipientEmail && invite.recipientEmail !== user.email) {
            return NextResponse.json(
                { error: "This invitation was sent to a different email address" },
                { status: 403 }
            );
        }

        // Update invite status
        await prisma.accessInvite.update({
            where: { id: invite.id },
            data: {
                status: "DENIED",
                respondedAt: new Date(),
                recipientId: user.id,
            },
        });

        // Create audit log
        await createAuditLog({
            userId: user.id,
            action: "INVITE_DENIED",
            targetType: "AccessInvite",
            targetId: invite.id,
            metadata: {
                childId: invite.childId,
                childName: invite.child.name,
            },
        });

        return NextResponse.json({
            message: "Invitation declined",
        });
    } catch (error) {
        console.error("Error declining invitation:", error);
        return NextResponse.json(
            { error: "Failed to decline invitation" },
            { status: 500 }
        );
    }
}
