"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  senderName: string;
}

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface ThreadClientProps {
  thread: {
    id: string;
    childName: string | null;
    participants: Participant[];
  };
  initialMessages: Message[];
  currentUserId: string;
}

export default function ThreadClient({
  thread,
  initialMessages,
  currentUserId,
}: ThreadClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherParticipants = thread.participants.filter(
    (p) => p.id !== currentUserId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    fetch(`/api/messages/threads/${thread.id}/read`, { method: "POST" });
  }, [thread.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/threads/${thread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* Header */}
      <div className="flex items-center space-x-4 pb-4 border-b border-sage-100 dark:border-sage-800">
        <Link
          href="/messages"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-medium">
            {otherParticipants[0]?.name?.charAt(0) || "?"}
          </div>
          <div>
            <h2 className="font-semibold text-sage-900 dark:text-white">
              {otherParticipants.map((p) => p.name).join(", ")}
            </h2>
            <p className="text-xs text-sage-500">
              {thread.childName && `Re: ${thread.childName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] ${isOwn
                    ? "bg-primary-500 text-white"
                    : "bg-sage-100 dark:bg-sage-800 text-sage-900 dark:text-white"
                  } rounded-2xl px-4 py-2`}
              >
                {!isOwn && (
                  <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
                    {message.senderName}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-sage-500"
                    }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-4 border-t border-sage-100 dark:border-sage-800">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="input-field resize-none min-h-11 max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="btn-primary h-11 px-4"
          >
            {isSending ? (
              <span className="material-symbols-rounded animate-spin">
                progress_activity
              </span>
            ) : (
              <span className="material-symbols-rounded">send</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
