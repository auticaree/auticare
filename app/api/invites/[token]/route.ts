import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ token: string }>;
}

// GET - Fetch invitation details by token
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { token } = await params;
        const session = await auth();

        // Find the invitation
        const invite = await prisma.accessInvite.findUnique({
            where: { token },
            include: {
                child: {
                    select: { name: true },
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

        // If user is not logged in, they need to create an account
        if (!session?.user) {
            return NextResponse.json({
                invite: {
                    id: invite.id,
                    childName: invite.child.name,
                    senderName: invite.sender.name,
                    scopes: invite.scopes,
                    expiresAt: invite.expiresAt.toISOString(),
                    status: invite.status,
                },
                needsAccount: true,
            });
        }

        // If logged in, check if their email matches
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, role: true },
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

        return NextResponse.json({
            invite: {
                id: invite.id,
                childName: invite.child.name,
                senderName: invite.sender.name,
                scopes: invite.scopes,
                expiresAt: invite.expiresAt.toISOString(),
                status: invite.status,
            },
            needsAccount: false,
        });
    } catch (error) {
        console.error("Error fetching invitation:", error);
        return NextResponse.json(
            { error: "Failed to fetch invitation" },
            { status: 500 }
        );
    }
}
