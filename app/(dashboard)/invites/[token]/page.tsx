"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface InviteDetails {
  id: string;
  childName: string;
  senderName: string;
  scopes: string[];
  expiresAt: string;
  status: string;
}

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string>("");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsAccount, setNeedsAccount] = useState(false);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/invites/${token}`);
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setNeedsAccount(true);
            // Store token for after registration/login
            sessionStorage.setItem("pendingInviteToken", token);
          } else {
            setError(data.error || "Invalid invitation");
          }
          setIsLoading(false);
          return;
        }

        setInvite(data.invite);
        setNeedsAccount(data.needsAccount || false);
      } catch {
        setError("Failed to load invitation details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  // Check if user just registered and came back
  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered === "true" && token) {
      // Refetch invite after registration
      setIsLoading(true);
      fetch(`/api/invites/${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.invite) {
            setInvite(data.invite);
            setNeedsAccount(false);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [searchParams, token]);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError("");

    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to accept invitation");
        return;
      }

      setSuccess("Invitation accepted! Redirecting to dashboard...");
      sessionStorage.removeItem("pendingInviteToken");

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!confirm("Are you sure you want to decline this invitation?")) return;

    setIsAccepting(true);
    setError("");

    try {
      const response = await fetch(`/api/invites/${token}/decline`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to decline invitation");
        return;
      }

      sessionStorage.removeItem("pendingInviteToken");
      router.push("/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsAccepting(false);
    }
  };

  const scopeLabels: Record<string, { label: string; icon: string }> = {
    MEDICAL_NOTES: { label: "Medical Notes", icon: "description" },
    SUPPORT_NOTES: { label: "Support Notes", icon: "note" },
    MESSAGES: { label: "Messages", icon: "chat" },
    VIDEO_VISITS: { label: "Video Visits", icon: "videocam" },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sage-50 dark:bg-sage-950 flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-rounded text-4xl text-primary-500 animate-spin">
            progress_activity
          </span>
          <p className="mt-4 text-sage-600 dark:text-sage-400">
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  if (needsAccount && !invite) {
    return (
      <div className="min-h-screen bg-sage-50 dark:bg-sage-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-sage-900 rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-rounded text-3xl text-primary-600 dark:text-primary-400">
                person_add
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
              Create an Account
            </h1>
            <p className="mt-2 text-sage-600 dark:text-sage-400">
              You need an account to accept this care team invitation.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href={`/register?invite=${token}`}
              className="btn-primary w-full flex items-center justify-center"
            >
              <span className="material-symbols-rounded mr-2">person_add</span>
              Create Account
            </Link>
            <Link
              href={`/login?invite=${token}`}
              className="btn-secondary w-full flex items-center justify-center"
            >
              <span className="material-symbols-rounded mr-2">login</span>
              I Already Have an Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-sage-50 dark:bg-sage-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-sage-900 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-coral-100 dark:bg-coral-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-rounded text-3xl text-coral-600 dark:text-coral-400">
              error
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white mb-2">
            Invalid Invitation
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-6">{error}</p>
          <Link href="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!invite) return null;

  const isExpired = new Date(invite.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-sage-50 dark:bg-sage-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-sage-900 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-br from-primary-500 to-primary-600 p-6 text-center text-white">
          <h1 className="text-2xl font-semibold">Care Team Invitation</h1>
          <p className="mt-1 text-primary-100">You&apos;ve been invited to join a care team</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-sm">
              {success}
            </div>
          )}

          {isExpired ? (
            <div className="text-center py-4">
              <span className="material-symbols-rounded text-4xl text-coral-500 mb-2">
                schedule
              </span>
              <p className="text-sage-700 dark:text-sage-300">
                This invitation has expired.
              </p>
              <p className="text-sm text-sage-500 mt-1">
                Please ask {invite.senderName} to send a new invitation.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sage-700 dark:text-sage-300">
                  <strong className="text-sage-900 dark:text-white">
                    {invite.senderName}
                  </strong>{" "}
                  has invited you to join the care team for
                </p>
                <p className="text-2xl font-semibold text-sage-900 dark:text-white mt-2">
                  {invite.childName}
                </p>
              </div>

              {/* Permissions */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
                  You will have access to:
                </h3>
                <div className="space-y-2">
                  {invite.scopes.map((scope) => {
                    const info = scopeLabels[scope] || {
                      label: scope,
                      icon: "check",
                    };
                    return (
                      <div
                        key={scope}
                        className="flex items-center p-3 bg-sage-50 dark:bg-sage-800 rounded-xl"
                      >
                        <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 mr-3">
                          {info.icon}
                        </span>
                        <span className="text-sage-700 dark:text-sage-300">
                          {info.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expiry */}
              <p className="text-xs text-sage-500 dark:text-sage-400 text-center mb-6">
                This invitation expires on{" "}
                {new Date(invite.expiresAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleDecline}
                  disabled={isAccepting}
                  className="btn-secondary flex-1"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="btn-primary flex-1"
                >
                  {isAccepting ? (
                    <>
                      <span className="material-symbols-rounded animate-spin mr-2">
                        progress_activity
                      </span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-rounded mr-2">
                        check_circle
                      </span>
                      Accept
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
