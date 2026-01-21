"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  childName?: string;
}

export default function NewMessagePage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const response = await fetch("/api/messages/recipients");
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.recipients);
        }
      } catch {
        console.error("Error fetching recipients");
      } finally {
        setIsFetching(false);
      }
    }
    fetchTeamMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecipients.length === 0 || !message.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: selectedRecipients,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send message");
        return;
      }

      router.push(`/messages/${data.thread.id}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <span className="material-symbols-rounded animate-spin text-3xl text-primary-500">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/messages"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            New Message
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Start a conversation with your care team
          </p>
        </div>
      </div>

      {teamMembers.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="material-symbols-rounded text-4xl text-sage-400 mb-4">
            group_off
          </span>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            No team members found
          </h3>
          <p className="text-sage-600 dark:text-sage-400">
            Add team members to your child&apos;s care team to start messaging.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300">
              <span className="material-symbols-rounded mr-2 align-middle">error</span>
              {error}
            </div>
          )}

          {/* Recipients */}
          <div className="card p-4">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
              Select Recipients
            </label>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                    selectedRecipients.includes(member.id)
                      ? "bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500"
                      : "bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRecipients.includes(member.id)}
                    onChange={() => toggleRecipient(member.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      member.role === "CLINICIAN"
                        ? "bg-lavender-100 dark:bg-lavender-900/30"
                        : member.role === "SUPPORT"
                        ? "bg-teal-100 dark:bg-teal-900/30"
                        : "bg-primary-100 dark:bg-primary-900/30"
                    }`}
                  >
                    <span
                      className={`material-symbols-rounded ${
                        member.role === "CLINICIAN"
                          ? "text-lavender-600 dark:text-lavender-400"
                          : member.role === "SUPPORT"
                          ? "text-teal-600 dark:text-teal-400"
                          : "text-primary-600 dark:text-primary-400"
                      }`}
                    >
                      {member.role === "CLINICIAN"
                        ? "medical_services"
                        : member.role === "SUPPORT"
                        ? "support_agent"
                        : "person"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sage-900 dark:text-white">
                      {member.name}
                    </p>
                    <p className="text-sm text-sage-500">
                      {member.role === "CLINICIAN"
                        ? "Healthcare Clinician"
                        : member.role === "SUPPORT"
                        ? "Support Professional"
                        : member.role === "PARENT"
                        ? "Parent"
                        : member.role}
                      {member.childName && ` • ${member.childName}`}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedRecipients.includes(member.id)
                        ? "border-primary-500 bg-primary-500"
                        : "border-sage-300 dark:border-sage-600"
                    }`}
                  >
                    {selectedRecipients.includes(member.id) && (
                      <span className="material-symbols-rounded text-white text-sm">
                        check
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="card p-4">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field min-h-37.5 resize-none"
              placeholder="Type your message..."
              required
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3">
            <Link href="/messages" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || selectedRecipients.length === 0 || !message.trim()}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-rounded animate-spin mr-2">
                    progress_activity
                  </span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded mr-2">send</span>
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
