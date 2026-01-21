"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        setTokenValid(response.ok);
      } catch {
        setTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50 dark:bg-sage-950 p-4">
        <div className="card p-8 text-center">
          <span className="material-symbols-rounded animate-spin text-4xl text-primary-600 dark:text-primary-400">
            progress_activity
          </span>
          <p className="mt-4 text-sage-600 dark:text-sage-400">
            Validating reset link...
          </p>
        </div>
      </div>
    );
  }

  // Invalid or missing token
  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50 dark:bg-sage-950 p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-coral-100 dark:bg-coral-900/30 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-rounded text-coral-600 dark:text-coral-400 text-3xl">
                link_off
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-sage-900 dark:text-white mb-2">
              Invalid or Expired Link
            </h1>
            <p className="text-sage-600 dark:text-sage-400 mb-6">
              This password reset link is invalid or has expired. Reset links are
              only valid for 30 minutes.
            </p>
            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="btn-primary w-full justify-center"
              >
                Request New Link
              </Link>
              <Link
                href="/login"
                className="btn-secondary w-full justify-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50 dark:bg-sage-950 p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-3xl">
                check_circle
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-sage-900 dark:text-white mb-2">
              Password Reset!
            </h1>
            <p className="text-sage-600 dark:text-sage-400 mb-6">
              Your password has been successfully reset. You&apos;ll be redirected to
              the login page shortly.
            </p>
            <Link href="/login" className="btn-primary w-full justify-center">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-sage-50 dark:bg-sage-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center shadow-glow">
              <span className="material-symbols-rounded text-white text-xl">
                psychiatry
              </span>
            </div>
            <span className="text-xl font-semibold text-sage-900 dark:text-white">
              AutiCare
            </span>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white mb-2">
            Set New Password
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-6">
            Enter your new password below. Make sure it&apos;s at least 8 characters
            long.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-xl text-coral-700 dark:text-coral-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="input"
                required
                minLength={8}
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="input"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="btn-primary w-full justify-center"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-rounded animate-spin mr-2">
                    progress_activity
                  </span>
                  Resetting...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded mr-2">lock_reset</span>
                  Reset Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-sage-50 dark:bg-sage-950 p-4">
          <div className="card p-8 text-center">
            <span className="material-symbols-rounded animate-spin text-4xl text-primary-600 dark:text-primary-400">
              progress_activity
            </span>
            <p className="mt-4 text-sage-600 dark:text-sage-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
