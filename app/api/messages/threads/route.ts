import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createThreadSchema = z.object({
  recipientIds: z.array(z.string()).min(1),
  message: z.string().min(1),
  childId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createThreadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { recipientIds, message, childId } = validation.data;

    // Check if thread already exists with these exact participants
    const allParticipantIds = [...new Set([session.user.id, ...recipientIds])];
    
    const existingThread = await prisma.messageThread.findFirst({
      where: {
        participants: {
          every: { id: { in: allParticipantIds } },
        },
        AND: {
          participants: {
            every: { id: { in: allParticipantIds } },
          },
        },
      },
      include: {
        participants: { select: { id: true } },
      },
    });

    // If exact match exists, add message to existing thread
    if (
      existingThread &&
      existingThread.participants.length === allParticipantIds.length
    ) {
      const newMessage = await prisma.message.create({
        data: {
          threadId: existingThread.id,
          senderId: session.user.id,
          content: message,
        },
      });

      await prisma.messageThread.update({
        where: { id: existingThread.id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        thread: existingThread,
        message: newMessage,
      });
    }

    // Create new thread
    const thread = await prisma.messageThread.create({
      data: {
        childId,
        participants: {
          connect: allParticipantIds.map((id) => ({ id })),
        },
        messages: {
          create: {
            senderId: session.user.id,
            content: message,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        messages: { take: 1 },
      },
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
