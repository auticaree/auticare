"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteNoteButtonProps {
  noteId: string;
  noteCategory: "medical" | "support";
}

export function DeleteNoteButton({ noteId, noteCategory }: DeleteNoteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const endpoint =
        noteCategory === "medical"
          ? `/api/notes/medical/${noteId}`
          : `/api/notes/support/${noteId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/notes");
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete note");
      }
    } catch {
      alert("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 rounded-xl text-coral-600 dark:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors"
        title="Delete note"
      >
        <span className="material-symbols-rounded">delete</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-coral-100 dark:bg-coral-900/30 flex items-center justify-center">
                <span className="material-symbols-rounded text-2xl text-coral-600 dark:text-coral-400">
                  warning
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sage-900 dark:text-white">
                  Delete Note?
                </h3>
                <p className="text-sm text-sage-600 dark:text-sage-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sage-700 dark:text-sage-300 mb-6">
              Are you sure you want to permanently delete this clinical note?
              This will remove all documentation associated with this entry.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-coral-600 text-white hover:bg-coral-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="material-symbols-rounded animate-spin mr-2">
                      progress_activity
                    </span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded mr-2">delete</span>
                    Delete Note
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
