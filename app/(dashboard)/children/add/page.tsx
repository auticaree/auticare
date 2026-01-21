"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FormData {
  name: string;
  dateOfBirth: string;
  timezone: string;
  notes: string;
}

export default function AddChildPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    dateOfBirth: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add child profile");
        return;
      }

      router.push(`/children/${data.child.id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href="/children"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Add Child Profile
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Create a profile to manage your child&apos;s care team
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="card p-6">
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300 text-sm">
            <span className="material-symbols-rounded text-sm mr-2 align-middle">
              error
            </span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
            >
              Child&apos;s Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
                person
              </span>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="input-field pl-10"
                placeholder="Enter your child's name"
                required
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
            >
              Date of Birth
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
                calendar_today
              </span>
              <input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                }
                className="input-field pl-10"
                required
              />
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
            >
              Timezone
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400">
                schedule
              </span>
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, timezone: e.target.value }))
                }
                className="input-field pl-10 appearance-none"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1"
            >
              Additional Notes{" "}
              <span className="text-sage-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="input-field min-h-[120px] resize-none"
              placeholder="Any additional information about your child that would be helpful for the care team..."
            />
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
            <div className="flex items-start space-x-3">
              <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 mt-0.5">
                info
              </span>
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
                  What happens next?
                </p>
                <p className="text-sm text-primary-700 dark:text-primary-400 mt-1">
                  After creating the profile, you can invite healthcare professionals
                  and support team members to access your child&apos;s information
                  and collaborate on care.
                </p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-sage-100 dark:border-sage-800">
            <Link href="/children" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? (
                <>
                  <span className="material-symbols-rounded animate-spin mr-2">
                    progress_activity
                  </span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded mr-2">add</span>
                  Create Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
