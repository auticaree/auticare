"use client";

import { useState } from "react";
import Link from "next/link";

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      key: "messages",
      label: "New Messages",
      description: "When you receive a new message from a care team member",
      email: true,
      push: true,
    },
    {
      key: "appointments",
      label: "Appointment Reminders",
      description: "Reminders for upcoming video consultations",
      email: true,
      push: true,
    },
    {
      key: "notes",
      label: "New Notes",
      description: "When a new medical or support note is added",
      email: true,
      push: false,
    },
    {
      key: "team",
      label: "Team Updates",
      description: "When team members are added or removed",
      email: true,
      push: false,
    },
    {
      key: "garden",
      label: "Garden Activity",
      description: "Updates about your child's garden progress",
      email: false,
      push: true,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleSetting = (key: string, type: "email" | "push") => {
    setSettings((prev) =>
      prev.map((s) =>
        s.key === key ? { ...s, [type]: !s[type] } : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSuccess(true);
    setIsLoading(false);
    setTimeout(() => setSuccess(false), 3000);
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
            Notifications
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Manage how you receive notifications
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {success && (
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
            <span className="material-symbols-rounded mr-2 align-middle">
              check_circle
            </span>
            Notification preferences saved!
          </div>
        )}

        {/* Notification Types */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-sage-900 dark:text-white">
              Notification Preferences
            </h3>
            <div className="flex items-center space-x-8 text-sm font-medium text-sage-600 dark:text-sage-400">
              <span className="flex items-center">
                <span className="material-symbols-rounded text-sm mr-1">
                  mail
                </span>
                Email
              </span>
              <span className="flex items-center">
                <span className="material-symbols-rounded text-sm mr-1">
                  notifications
                </span>
                Push
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between py-4 border-b border-sage-100 dark:border-sage-800 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-sage-900 dark:text-white">
                    {setting.label}
                  </p>
                  <p className="text-sm text-sage-500 dark:text-sage-400">
                    {setting.description}
                  </p>
                </div>
                <div className="flex items-center space-x-8">
                  {/* Email Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleSetting(setting.key, "email")}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      setting.email
                        ? "bg-primary-500"
                        : "bg-sage-200 dark:bg-sage-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                        setting.email ? "left-7" : "left-1"
                      }`}
                    />
                  </button>

                  {/* Push Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleSetting(setting.key, "push")}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      setting.push
                        ? "bg-primary-500"
                        : "bg-sage-200 dark:bg-sage-700"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                        setting.push ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
            Quiet Hours
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Do Not Disturb
              </p>
              <p className="text-sm text-sage-500 dark:text-sage-400">
                Pause notifications during set hours
              </p>
            </div>
            <span className="badge bg-sage-100 dark:bg-sage-800 text-sage-600 dark:text-sage-400">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3">
          <Link href="/settings" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading} className="btn-primary">
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
                Save Preferences
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
