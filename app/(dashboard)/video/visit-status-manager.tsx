"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VisitStatus } from "@prisma/client";

interface VisitStatusManagerProps {
  visitId: string;
  currentStatus: VisitStatus;
  visitTitle: string;
  childName: string;
  canManage: boolean;
}

export default function VisitStatusManager({
  visitId,
  currentStatus,
  visitTitle,
  childName,
  canManage,
}: VisitStatusManagerProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"CANCELLED" | "NO_SHOW" | null>(null);
  const [error, setError] = useState("");

  const updateStatus = async (newStatus: "CANCELLED" | "NO_SHOW") => {
    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch(`/api/video-visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      setShowConfirm(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setIsUpdating(false);
    }
  };

  // Only show for scheduled visits that user can manage
  if (!canManage || currentStatus !== "SCHEDULED") {
    return null;
  }

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 -mt-12 p-2 bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300 text-xs rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowConfirm("CANCELLED")}
          disabled={isUpdating}
          className="btn-secondary text-sm py-1.5 px-3"
          title="Cancel this appointment"
        >
          <span className="material-symbols-rounded text-sm mr-1">close</span>
          Cancel
        </button>
        <button
          onClick={() => setShowConfirm("NO_SHOW")}
          disabled={isUpdating}
          className="btn-secondary text-sm py-1.5 px-3 text-amber-600 dark:text-amber-400"
          title="Mark patient as no-show"
        >
          <span className="material-symbols-rounded text-sm mr-1">person_off</span>
          No-Show
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="card p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div
                className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${showConfirm === "NO_SHOW"
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-coral-100 dark:bg-coral-900/30"
                  }`}
              >
                <span
                  className={`material-symbols-rounded text-3xl ${showConfirm === "NO_SHOW"
                      ? "text-amber-500"
                      : "text-coral-500"
                    }`}
                >
                  {showConfirm === "NO_SHOW" ? "person_off" : "event_busy"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                {showConfirm === "NO_SHOW"
                  ? "Mark as No-Show?"
                  : "Cancel Appointment?"}
              </h3>
              <p className="text-sage-600 dark:text-sage-400 mb-6">
                {showConfirm === "NO_SHOW"
                  ? `This will mark the appointment "${visitTitle}" with ${childName} as a no-show.`
                  : `Are you sure you want to cancel the appointment "${visitTitle}" with ${childName}?`}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirm(null)}
                  disabled={isUpdating}
                  className="btn-secondary"
                >
                  Go Back
                </button>
                <button
                  onClick={() => updateStatus(showConfirm)}
                  disabled={isUpdating}
                  className={`${showConfirm === "NO_SHOW"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-coral-600 hover:bg-coral-700 text-white"
                    } px-4 py-2 rounded-xl font-medium transition-colors`}
                >
                  {isUpdating ? (
                    <span className="material-symbols-rounded animate-spin">
                      progress_activity
                    </span>
                  ) : showConfirm === "NO_SHOW" ? (
                    "Confirm No-Show"
                  ) : (
                    "Cancel Appointment"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
