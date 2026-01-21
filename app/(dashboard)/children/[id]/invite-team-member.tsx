"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  childId: string;
}

export default function InviteTeamMember({ childId }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    scopes: ["MEDICAL_NOTES", "SUPPORT_NOTES", "MESSAGES"] as string[],
  });

  const scopeOptions = [
    { value: "MEDICAL_NOTES", label: "Medical Notes", icon: "description" },
    { value: "SUPPORT_NOTES", label: "Support Notes", icon: "note" },
    { value: "MESSAGES", label: "Messages", icon: "chat" },
    { value: "VIDEO_VISITS", label: "Video Visits", icon: "videocam" },
  ];

  const handleScopeToggle = (scope: string) => {
    setFormData((prev) => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter((s) => s !== scope)
        : [...prev.scopes, scope],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/children/${childId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send invitation");
        return;
      }

      setSuccess("Invitation sent successfully!");
      setFormData({ email: "", scopes: ["MEDICAL_NOTES", "SUPPORT_NOTES", "MESSAGES"] });
      
      setTimeout(() => {
        setIsOpen(false);
        setSuccess("");
        router.refresh();
      }, 2000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
      >
        <span className="material-symbols-rounded text-sm mr-1">person_add</span>
        Invite
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-sage-900/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white dark:bg-sage-900 rounded-2xl shadow-xl">
            <div className="p-6 border-b border-sage-100 dark:border-sage-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-sage-900 dark:text-white">
                  Invite Care Team Member
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-sage-100 dark:hover:bg-sage-800"
                >
                  <span className="material-symbols-rounded text-sage-500">
                    close
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm">
                  {success}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
                >
                  Professional&apos;s Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="input-field"
                  placeholder="doctor@example.com"
                  required
                />
                <p className="mt-1 text-xs text-sage-500 dark:text-sage-400">
                  They will receive an email to accept the invitation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {scopeOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                        formData.scopes.includes(option.value)
                          ? "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500"
                          : "bg-sage-50 dark:bg-sage-800 border-2 border-transparent"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.scopes.includes(option.value)}
                        onChange={() => handleScopeToggle(option.value)}
                        className="sr-only"
                      />
                      <span
                        className={`material-symbols-rounded mr-3 ${
                          formData.scopes.includes(option.value)
                            ? "text-primary-600 dark:text-primary-400"
                            : "text-sage-400"
                        }`}
                      >
                        {option.icon}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          formData.scopes.includes(option.value)
                            ? "text-primary-700 dark:text-primary-300"
                            : "text-sage-600 dark:text-sage-400"
                        }`}
                      >
                        {option.label}
                      </span>
                      {formData.scopes.includes(option.value) && (
                        <span className="ml-auto material-symbols-rounded text-primary-600 dark:text-primary-400">
                          check_circle
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || formData.scopes.length === 0}
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
                      Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
