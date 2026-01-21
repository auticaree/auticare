"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function ProfileSettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setSuccess(true);
      await updateSession({ name });
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/settings"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Profile
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Update your personal information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
            <span className="material-symbols-rounded mr-2 align-middle">
              check_circle
            </span>
            Profile updated successfully!
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300">
            <span className="material-symbols-rounded mr-2 align-middle">
              error
            </span>
            {error}
          </div>
        )}

        {/* Avatar */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-4">
            Profile Photo
          </label>
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 rounded-full bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold">
              {name.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-sm text-sage-600 dark:text-sage-400 mb-2">
                Your profile photo is generated from your name initial
              </p>
              <p className="text-xs text-sage-500">
                Photo upload coming soon in a future update
              </p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div className="card p-6">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Your full name"
            required
          />
          <p className="mt-2 text-sm text-sage-500">
            This is how your name will appear to care team members
          </p>
        </div>

        {/* Email (read-only) */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={session?.user?.email || ""}
            className="input-field bg-sage-100 dark:bg-sage-800"
            disabled
          />
          <p className="mt-2 text-sm text-sage-500">
            Email cannot be changed. Contact support if you need to update it.
          </p>
        </div>

        {/* Role (read-only) */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
            Account Type
          </label>
          <div className="flex items-center space-x-2">
            <span className="badge badge-primary">
              {session?.user?.role === "PARENT"
                ? "Parent"
                : session?.user?.role === "CLINICIAN"
                ? "Healthcare Clinician"
                : session?.user?.role === "SUPPORT"
                ? "Support Professional"
                : session?.user?.role === "ADMIN"
                ? "Administrator"
                : session?.user?.role}
            </span>
          </div>
          <p className="mt-2 text-sm text-sage-500">
            Account type is assigned during registration and cannot be changed
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3">
          <Link href="/settings" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-rounded animate-spin mr-2">
                  progress_activity
                </span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded mr-2">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
