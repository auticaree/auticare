import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ThreadClient from "./thread-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MessageThreadPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  // Get thread with messages
  const thread = await prisma.messageThread.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      child: {
        select: { id: true, name: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!thread) notFound();

  // Verify user is a participant
  const isParticipant = thread.participants.some((p) => p.userId === session.user.id);
  if (!isParticipant) {
    redirect("/messages");
  }

  return (
    <ThreadClient
      thread={{
        id: thread.id,
        childName: thread.child?.name || null,
        participants: thread.participants.map((p) => ({
          id: p.user.id,
          name: p.user.name || "Unknown",
          role: p.user.role,
        })),
      }}
      initialMessages={thread.messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        senderName: m.sender.name || "Unknown",
      }))}
      currentUserId={session.user.id}
    />
  );
}
