import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: threadId } = await params;

    // Verify thread exists and user is participant
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        participants: { select: { userId: true } },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (!thread.participants.some((p) => p.userId === session.user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update lastReadAt for the current user's participant record
    await prisma.threadParticipant.updateMany({
      where: {
        threadId,
        userId: session.user.id,
      },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
