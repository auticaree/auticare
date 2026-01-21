"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send reset link");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50 dark:bg-sage-950 p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-3xl">
                mark_email_read
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-sage-900 dark:text-white mb-2">
              Check your email
            </h1>
            <p className="text-sage-600 dark:text-sage-400 mb-6">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
              The link will expire in 30 minutes.
            </p>
            <div className="space-y-3">
              <Link href="/login" className="btn-primary w-full justify-center">
                Return to Login
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sage-50 dark:bg-sage-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-glow">
              <img src="/logo.jpeg" alt="AutiCare" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-semibold text-sage-900 dark:text-white">
              AutiCare
            </span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white mb-2">
            Forgot your password?
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-6">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-xl text-coral-700 dark:text-coral-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="btn-primary w-full justify-center"
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
                  <span className="material-symbols-rounded mr-2">send</span>
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center"
            >
              <span className="material-symbols-rounded text-sm mr-1">
                arrow_back
              </span>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
