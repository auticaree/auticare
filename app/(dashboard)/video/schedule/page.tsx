"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Child {
  id: string;
  name: string;
}

interface Professional {
  id: string;
  name: string;
  role: string;
}

export default function ScheduleVideoPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    childId: "",
    professionalId: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: "30",
    title: "",
    reason: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [childrenRes, professionalsRes] = await Promise.all([
          fetch("/api/children"),
          fetch("/api/professionals"),
        ]);

        const childrenData = await childrenRes.json();
        const professionalsData = await professionalsRes.json();

        if (childrenRes.ok) {
          setChildren(childrenData.children);
          if (childrenData.children.length === 1) {
            setFormData((prev) => ({ ...prev, childId: childrenData.children[0].id }));
          }
        }

        if (professionalsRes.ok) {
          setProfessionals(professionalsData.professionals);
        }
      } catch {
        console.error("Error fetching data");
      } finally {
        setIsFetching(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const scheduledAt = new Date(
      `${formData.scheduledDate}T${formData.scheduledTime}`
    ).toISOString();

    try {
      const response = await fetch("/api/video-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: formData.childId,
          title: formData.title || `Video Visit - ${formData.scheduledDate}`,
          reason: formData.reason,
          scheduledAt,
          participantIds: formData.professionalId ? [formData.professionalId] : [],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to schedule visit");
        return;
      }

      router.push("/video");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

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
          href="/video"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Schedule Video Visit
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Book a video consultation appointment
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="material-symbols-rounded text-4xl text-sage-400 mb-4">
            group_off
          </span>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            No patients available
          </h3>
          <p className="text-sage-600 dark:text-sage-400">
            Add a child profile first to schedule video visits.
          </p>
          <Link href="/children/add" className="btn-primary inline-flex mt-4">
            <span className="material-symbols-rounded mr-2">person_add</span>
            Add Child
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300">
              <span className="material-symbols-rounded mr-2 align-middle">error</span>
              {error}
            </div>
          )}

          {/* Child Selection */}
          <div className="card p-4">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
              Select Patient
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {children.map((child) => (
                <label
                  key={child.id}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                    formData.childId === child.id
                      ? "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500"
                      : "bg-sage-50 dark:bg-sage-800 border-2 border-transparent hover:border-sage-200 dark:hover:border-sage-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="childId"
                    value={child.id}
                    checked={formData.childId === child.id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, childId: e.target.value }))
                    }
                    className="sr-only"
                    required
                  />
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-medium mr-3">
                    {child.name.charAt(0)}
                  </div>
                  <span className="font-medium text-sage-900 dark:text-white">
                    {child.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Professional Selection */}
          <div className="card p-4">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
              Select Provider
            </label>
            {professionals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {professionals.map((prof) => (
                  <label
                    key={prof.id}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${
                      formData.professionalId === prof.id
                        ? "bg-lavender-50 dark:bg-lavender-900/20 border-2 border-lavender-500"
                        : "bg-sage-50 dark:bg-sage-800 border-2 border-transparent hover:border-sage-200 dark:hover:border-sage-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="professionalId"
                      value={prof.id}
                      checked={formData.professionalId === prof.id}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, professionalId: e.target.value }))
                      }
                      className="sr-only"
                      required
                    />
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${
                        prof.role === "CLINICIAN"
                          ? "bg-lavender-100 dark:bg-lavender-900/30"
                          : "bg-teal-100 dark:bg-teal-900/30"
                      }`}
                    >
                      <span
                        className={`material-symbols-rounded ${
                          prof.role === "CLINICIAN"
                            ? "text-lavender-600 dark:text-lavender-400"
                            : "text-teal-600 dark:text-teal-400"
                        }`}
                      >
                        {prof.role === "CLINICIAN" ? "medical_services" : "support_agent"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-sage-900 dark:text-white block">
                        {prof.name}
                      </span>
                      <span className="text-xs text-sage-500">
                        {prof.role === "CLINICIAN" ? "Healthcare Clinician" : "Support Professional"}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-sage-50 dark:bg-sage-800/50 rounded-xl text-center">
                <p className="text-sage-600 dark:text-sage-400">
                  No care team members found. Invite professionals to your child&apos;s care team first.
                </p>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-4">
              Schedule Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledDate: e.target.value }))
                  }
                  min={today}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledTime: e.target.value }))
                  }
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                Duration
              </label>
              <div className="flex rounded-xl bg-sage-100 dark:bg-sage-800 p-1">
                {["15", "30", "45", "60"].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, duration }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.duration === duration
                        ? "bg-white dark:bg-sage-700 text-sage-900 dark:text-white shadow-sm"
                        : "text-sage-600 dark:text-sage-400"
                    }`}
                  >
                    {duration} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title and Reason */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-4">
              Visit Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                  Visit Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="input-field"
                  placeholder="e.g., Monthly Check-in, Follow-up Visit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                  Reason for Visit (optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, reason: e.target.value }))
                  }
                  className="input-field min-h-25 resize-none"
                  placeholder="Topics to discuss, concerns to address..."
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3">
            <Link href="/video" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={
                isLoading ||
                !formData.childId ||
                !formData.professionalId ||
                !formData.scheduledDate ||
                !formData.scheduledTime
              }
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-rounded animate-spin mr-2">
                    progress_activity
                  </span>
                  Scheduling...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded mr-2">event</span>
                  Schedule Visit
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
