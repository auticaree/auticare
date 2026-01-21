"use client";

import { useState } from "react";
import Link from "next/link";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update password");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
            Security
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Password and authentication settings
          </p>
        </div>
      </div>

      {/* Password Change Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
            <span className="material-symbols-rounded mr-2 align-middle">
              check_circle
            </span>
            Password updated successfully!
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

        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-medium text-sage-900 dark:text-white">
            Change Password
          </h3>

          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              minLength={8}
              required
            />
            <p className="mt-1 text-sm text-sage-500">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Two-Factor Authentication (Coming Soon) */}
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium text-sage-900 dark:text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">
                Add an extra layer of security to your account
              </p>
            </div>
            <span className="badge bg-sage-100 dark:bg-sage-800 text-sage-600 dark:text-sage-400">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
            Active Sessions
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-sage-50 dark:bg-sage-800 rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                  computer
                </span>
                <div>
                  <p className="font-medium text-sage-900 dark:text-white">
                    Current Session
                  </p>
                  <p className="text-sm text-sage-500">
                    This device · Active now
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium">
                Current
              </span>
            </div>
          </div>
          <p className="text-sm text-sage-500 mt-4">
            Session management features coming in a future update
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3">
          <Link href="/settings" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-rounded animate-spin mr-2">
                  progress_activity
                </span>
                Updating...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded mr-2">lock</span>
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
