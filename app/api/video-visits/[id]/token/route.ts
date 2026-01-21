import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessToken } from "livekit-server-sdk";
import { Role } from "@prisma/client";

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
        const userRole = session.user.role as Role;

        // Fetch the visit
        const visit = await prisma.videoVisit.findUnique({
            where: { id },
            include: {
                child: {
                    select: {
                        id: true,
                        parentId: true,
                    },
                },
            },
        });

        if (!visit) {
            return NextResponse.json({ error: "Visit not found" }, { status: 404 });
        }

        // Verify access: parent of the child, host, or admin
        const isParent = userRole === Role.PARENT && visit.child.parentId === session.user.id;
        const isHost = visit.hostId === session.user.id;
        const isAdmin = userRole === Role.ADMIN;

        if (!isParent && !isHost && !isAdmin) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // LiveKit credentials from environment
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
            console.error("LiveKit credentials not configured");
            return NextResponse.json(
                { error: "Video service not configured" },
                { status: 500 }
            );
        }

        // Create access token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: session.user.id,
            name: session.user.name || "Participant",
            ttl: "2h",
        });

        // Grant permissions for this room
        at.addGrant({
            room: visit.roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();

        // Record participant joining
        await prisma.videoVisitParticipant.upsert({
            where: {
                visitId_userId: {
                    visitId: visit.id,
                    userId: session.user.id,
                },
            },
            update: {
                joinedAt: new Date(),
                admitted: true,
            },
            create: {
                visitId: visit.id,
                userId: session.user.id,
                joinedAt: new Date(),
                admitted: true,
            },
        });

        return NextResponse.json({
            token,
            wsUrl,
            roomName: visit.roomName,
        });
    } catch (error) {
        console.error("Error generating video token:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
