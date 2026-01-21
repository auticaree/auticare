"use client";

import { useState } from "react";

const feedbackTypes = [
  { value: "feature", label: "Feature Request", icon: "lightbulb" },
  { value: "bug", label: "Bug Report", icon: "bug_report" },
  { value: "improvement", label: "Improvement", icon: "trending_up" },
  { value: "general", label: "General Feedback", icon: "chat" },
];

export function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (message.trim().length < 10) {
      setError("Please write at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          message: message.trim(),
          rating: rating || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage("");
        setRating(0);
        setFeedbackType("general");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button onClick={() => setIsOpen(true)} className="btn-primary">
        <span className="material-symbols-rounded mr-2">edit_note</span>
        Share Feedback
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-sage-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {submitted ? (
              /* Success State */
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-rounded text-teal-500 text-3xl">
                    check_circle
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-sage-900 dark:text-white mb-2">
                  Thank You!
                </h3>
                <p className="text-sage-600 dark:text-sage-400">
                  Your feedback has been sent. We appreciate your input!
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-sage-200 dark:border-sage-700">
                  <h2 className="text-lg font-semibold text-sage-900 dark:text-white">
                    Share Your Feedback
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-sage-100 dark:hover:bg-sage-800 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    <span className="material-symbols-rounded text-sage-500">
                      close
                    </span>
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Feedback Type */}
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                      What type of feedback?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {feedbackTypes.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFeedbackType(type.value)}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            feedbackType === type.value
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-sage-200 dark:border-sage-700 hover:border-sage-300"
                          }`}
                        >
                          <span
                            className={`material-symbols-rounded ${
                              feedbackType === type.value
                                ? "text-primary-500"
                                : "text-sage-400"
                            }`}
                          >
                            {type.icon}
                          </span>
                          <span
                            className={`text-sm font-medium ${
                              feedbackType === type.value
                                ? "text-primary-700 dark:text-primary-300"
                                : "text-sage-600 dark:text-sage-400"
                            }`}
                          >
                            {type.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                      How's your experience so far? (optional)
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star === rating ? 0 : star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <span
                            className={`material-symbols-rounded text-3xl ${
                              star <= (hoveredRating || rating)
                                ? "text-amber-400"
                                : "text-sage-300 dark:text-sage-600"
                            }`}
                            style={{
                              fontVariationSettings:
                                star <= (hoveredRating || rating)
                                  ? "'FILL' 1"
                                  : "'FILL' 0",
                            }}
                          >
                            star
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                      Your feedback
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you think, what features you'd like, or report any issues..."
                      rows={4}
                      className="input resize-none"
                      required
                      minLength={10}
                    />
                    <p className="text-xs text-sage-500 mt-1">
                      {message.length}/500 characters
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-sage-200 dark:border-sage-700">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting || message.trim().length < 10}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-rounded animate-spin mr-2">
                          progress_activity
                        </span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-rounded mr-2">
                          send
                        </span>
                        Send Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
