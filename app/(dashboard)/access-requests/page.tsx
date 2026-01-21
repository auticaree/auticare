"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { PermissionScope } from "@prisma/client";

interface AccessRequest {
  id: string;
  childId: string;
  professionalId: string;
  requestedScopes: PermissionScope[];
  message: string | null;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
  respondedAt: string | null;
  child: {
    id: string;
    name: string;
    parent?: { name: string; email: string };
  };
  professional?: {
    id: string;
    name: string;
    email: string;
    role: string;
    licenseNumber: string | null;
  };
}

interface Child {
  id: string;
  name: string;
}

const SCOPE_LABELS: Record<PermissionScope, { label: string; icon: string; description: string }> = {
  MEDICAL_NOTES: {
    label: "Medical Notes",
    icon: "medical_information",
    description: "Access to medical records and clinical notes",
  },
  SUPPORT_NOTES: {
    label: "Support Notes",
    icon: "psychology",
    description: "Access to therapy and support session notes",
  },
  MESSAGES: {
    label: "Messages",
    icon: "chat",
    description: "Ability to send and receive messages",
  },
  VIDEO_VISITS: {
    label: "Video Visits",
    icon: "videocam",
    description: "Participate in video consultations",
  },
};

export default function AccessRequestsPage() {
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  // New request form state (for professionals)
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<PermissionScope[]>([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Child[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/access-requests");
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setRequests(data.requests || []);
      setUserRole(data.role);
    } catch (err) {
      setError("Failed to load access requests");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChildren = useCallback(async () => {
    try {
      const response = await fetch("/api/children");
      if (!response.ok) return;
      const data = await response.json();
      setChildren(data.children || []);
    } catch (err) {
      console.error("Failed to fetch children:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchRequests();
      fetchChildren();
    }
  }, [status, fetchRequests, fetchChildren]);

  // Search for children (for professionals to request access)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/children/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.children || []);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId || selectedScopes.length === 0) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          requestedScopes: selectedScopes,
          message: requestMessage || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit request");
      }

      // Reset form and refresh
      setShowNewRequestForm(false);
      setSelectedChildId("");
      setSelectedScopes([]);
      setRequestMessage("");
      setSearchQuery("");
      setSearchResults([]);
      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: "APPROVED" | "DENIED") => {
    try {
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to respond to request");
      }

      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      const response = await fetch(`/api/access-requests/${requestId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel request");
      }

      fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  };

  const toggleScope = (scope: PermissionScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const processedRequests = requests.filter((r) => r.status !== "PENDING");

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="material-symbols-rounded animate-spin text-4xl text-primary-500">
          progress_activity
        </span>
      </div>
    );
  }

  const isProfessional = ["CLINICIAN", "SUPPORT"].includes(userRole);
  const isParent = userRole === "PARENT";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Access Requests
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mt-1">
            {isParent
              ? "Review and manage access requests from healthcare professionals"
              : "Request access to patient records or view your pending requests"}
          </p>
        </div>
        {isProfessional && (
          <button
            onClick={() => setShowNewRequestForm(!showNewRequestForm)}
            className="btn-primary"
          >
            <span className="material-symbols-rounded mr-2">add</span>
            Request Access
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 rounded-xl text-coral-700 dark:text-coral-300">
          {error}
          <button onClick={() => setError("")} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* New Request Form (for professionals) */}
      {showNewRequestForm && isProfessional && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
            Request Patient Access
          </h2>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {/* Search for child */}
            <div>
              <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                Search for Patient
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter patient name..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="btn-secondary"
                >
                  {isSearching ? (
                    <span className="material-symbols-rounded animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-rounded">search</span>
                  )}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border border-sage-200 dark:border-sage-700 rounded-xl overflow-hidden">
                  {searchResults.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        setSelectedChildId(child.id);
                        setSearchResults([]);
                        setSearchQuery(child.name);
                      }}
                      className={`w-full p-3 text-left hover:bg-sage-50 dark:hover:bg-sage-800 flex items-center gap-3 ${selectedChildId === child.id ? "bg-primary-50 dark:bg-primary-900/20" : ""
                        }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-medium">
                        {child.name.charAt(0)}
                      </div>
                      <span className="text-sage-900 dark:text-white">{child.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedChildId && (
                <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
                  Selected: {searchQuery}
                </p>
              )}
            </div>

            {/* Scope selection */}
            <div>
              <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                Requested Permissions
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(SCOPE_LABELS) as [PermissionScope, typeof SCOPE_LABELS[PermissionScope]][]).map(
                  ([scope, info]) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => toggleScope(scope)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${selectedScopes.includes(scope)
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                          : "border-sage-200 dark:border-sage-700 hover:border-sage-300"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`material-symbols-rounded ${selectedScopes.includes(scope)
                              ? "text-primary-600 dark:text-primary-400"
                              : "text-sage-400"
                            }`}
                        >
                          {info.icon}
                        </span>
                        <span className="font-medium text-sage-900 dark:text-white">
                          {info.label}
                        </span>
                      </div>
                      <p className="text-xs text-sage-500 dark:text-sage-400 mt-1">
                        {info.description}
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                Message to Parent (Optional)
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Explain why you're requesting access..."
                className="input min-h-25"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewRequestForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedChildId || selectedScopes.length === 0}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-rounded animate-spin mr-2">progress_activity</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded mr-2">send</span>
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-sage-100 dark:border-sage-800">
            <h2 className="font-semibold text-sage-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-rounded text-amber-500">pending</span>
              Pending Requests
              <span className="badge badge-amber">{pendingRequests.length}</span>
            </h2>
          </div>
          <div className="divide-y divide-sage-100 dark:divide-sage-800">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white font-medium shrink-0">
                      {isParent
                        ? request.professional?.name.charAt(0)
                        : request.child.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sage-900 dark:text-white">
                        {isParent ? request.professional?.name : request.child.name}
                      </p>
                      <p className="text-sm text-sage-500 dark:text-sage-400">
                        {isParent
                          ? `${request.professional?.role} • ${request.professional?.email}`
                          : `Parent: ${request.child.parent?.name}`}
                      </p>
                      {isParent && request.professional?.licenseNumber && (
                        <p className="text-xs text-sage-400 dark:text-sage-500 mt-1">
                          License: {request.professional.licenseNumber}
                        </p>
                      )}
                      {request.message && (
                        <p className="text-sm text-sage-600 dark:text-sage-400 mt-2 bg-sage-50 dark:bg-sage-800/50 p-2 rounded-lg">
                          &ldquo;{request.message}&rdquo;
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {request.requestedScopes.map((scope) => (
                          <span
                            key={scope}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sage-100 dark:bg-sage-800 text-xs text-sage-600 dark:text-sage-400"
                          >
                            <span className="material-symbols-rounded text-xs">
                              {SCOPE_LABELS[scope].icon}
                            </span>
                            {SCOPE_LABELS[scope].label}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-sage-400 dark:text-sage-500 mt-2">
                        Requested {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    {isParent ? (
                      <>
                        <button
                          onClick={() => handleRespondToRequest(request.id, "APPROVED")}
                          className="btn-primary text-sm py-2 px-3"
                        >
                          <span className="material-symbols-rounded text-sm mr-1">check</span>
                          Approve
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(request.id, "DENIED")}
                          className="btn-secondary text-sm py-2 px-3"
                        >
                          <span className="material-symbols-rounded text-sm mr-1">close</span>
                          Deny
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        <span className="material-symbols-rounded text-sm mr-1">close</span>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-sage-100 dark:border-sage-800">
            <h2 className="font-semibold text-sage-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-rounded text-sage-400">history</span>
              Request History
            </h2>
          </div>
          <div className="divide-y divide-sage-100 dark:divide-sage-800">
            {processedRequests.map((request) => (
              <div key={request.id} className="p-4 opacity-75">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sage-200 dark:bg-sage-700 flex items-center justify-center text-sage-500 dark:text-sage-400 font-medium shrink-0">
                    {isParent
                      ? request.professional?.name.charAt(0)
                      : request.child.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sage-700 dark:text-sage-300">
                        {isParent ? request.professional?.name : request.child.name}
                      </p>
                      <span
                        className={`badge ${request.status === "APPROVED"
                            ? "badge-primary"
                            : "badge-coral"
                          }`}
                      >
                        {request.status}
                      </span>
                    </div>
                    <p className="text-xs text-sage-400 dark:text-sage-500 mt-1">
                      {request.status === "APPROVED" ? "Approved" : "Denied"}{" "}
                      {request.respondedAt &&
                        new Date(request.respondedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="card p-12 text-center">
          <span className="material-symbols-rounded text-5xl text-sage-300 dark:text-sage-600">
            {isParent ? "inbox" : "send"}
          </span>
          <h3 className="mt-4 text-lg font-medium text-sage-900 dark:text-white">
            No Access Requests
          </h3>
          <p className="mt-2 text-sage-600 dark:text-sage-400">
            {isParent
              ? "When healthcare professionals request access to your children's records, they will appear here."
              : "You haven't submitted any access requests yet. Click 'Request Access' to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
