import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = session.user.role as Role;

  // Get message threads for the user
  const threads = await prisma.messageThread.findMany({
    where: {
      participants: {
        some: { userId: session.user.id },
      },
    },
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
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate unread count based on lastReadAt
  const getUnreadCount = (thread: typeof threads[0]) => {
    const userParticipant = thread.participants.find(p => p.userId === session.user.id);
    if (!userParticipant?.lastReadAt) {
      // Never read - count all messages not from user
      return thread.messages.filter(m => m.senderId !== session.user.id).length > 0 ? 1 : 0;
    }
    // For now, simplified - just check if last message is after lastReadAt and not from user
    const lastMsg = thread.messages[0];
    if (lastMsg && lastMsg.senderId !== session.user.id && lastMsg.createdAt > userParticipant.lastReadAt) {
      return 1;
    }
    return 0;
  };

  const totalUnread = threads.reduce((sum, t) => sum + getUnreadCount(t), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Messages
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread !== 1 ? "s" : ""}`
              : "Secure team communication"}
          </p>
        </div>
        <Link href="/messages/new" className="btn-primary">
          <span className="material-symbols-rounded mr-2">edit</span>
          New Message
        </Link>
      </div>

      {/* Threads List */}
      {threads.length > 0 ? (
        <div className="space-y-2">
          {threads.map((thread) => {
            const otherParticipants = thread.participants
              .filter((p) => p.userId !== session.user.id)
              .map(p => p.user);
            const lastMessage = thread.messages[0];
            const unreadCount = getUnreadCount(thread);
            const isUnread = unreadCount > 0;

            return (
              <Link
                key={thread.id}
                href={`/messages/${thread.id}`}
                className={`card p-4 block transition-all hover:shadow-lg ${
                  isUnread ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20" : ""
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-medium">
                      {otherParticipants[0]?.name?.charAt(0) || "?"}
                    </div>
                    {isUnread && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-white text-xs flex items-center justify-center font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <h3
                          className={`font-medium truncate ${
                            isUnread
                              ? "text-sage-900 dark:text-white"
                              : "text-sage-700 dark:text-sage-300"
                          }`}
                        >
                          {otherParticipants.map((p) => p.name).join(", ") ||
                            "Unknown"}
                        </h3>
                        {thread.child && (
                          <span className="badge badge-sage text-xs">
                            {thread.child.name}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <span className="text-xs text-sage-500 whitespace-nowrap">
                          {new Date(lastMessage.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      )}
                    </div>

                    {/* Role badges */}
                    <div className="flex items-center space-x-1 mb-1">
                      {otherParticipants.map((p) => (
                        <span
                          key={p.id}
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            p.role === Role.CLINICIAN
                              ? "bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300"
                              : p.role === Role.SUPPORT
                              ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                              : "bg-sage-100 dark:bg-sage-800 text-sage-600 dark:text-sage-400"
                          }`}
                        >
                          {p.role === Role.CLINICIAN
                            ? "Clinician"
                            : p.role === Role.SUPPORT
                            ? "Support"
                            : p.role === Role.PARENT
                            ? "Parent"
                            : p.role}
                        </span>
                      ))}
                    </div>

                    {/* Last message preview */}
                    {lastMessage && (
                      <p
                        className={`text-sm truncate ${
                          isUnread
                            ? "text-sage-700 dark:text-sage-300"
                            : "text-sage-500 dark:text-sage-400"
                        }`}
                      >
                        {lastMessage.senderId === session.user.id && (
                          <span className="text-sage-400">You: </span>
                        )}
                        {lastMessage.content}
                      </p>
                    )}
                  </div>

                  <span className="material-symbols-rounded text-sage-400">
                    chevron_right
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-sage-100 dark:bg-sage-800 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-4xl text-sage-400">
              forum
            </span>
          </div>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            No messages yet
          </h3>
          <p className="text-sage-600 dark:text-sage-400 mb-6 max-w-md mx-auto">
            Start a conversation with your care team to coordinate support.
          </p>
          <Link href="/messages/new" className="btn-primary inline-flex">
            <span className="material-symbols-rounded mr-2">edit</span>
            Start a Conversation
          </Link>
        </div>
      )}
    </div>
  );
}
