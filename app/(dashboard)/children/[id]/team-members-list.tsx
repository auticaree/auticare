"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role, PermissionScope } from "@prisma/client";

interface TeamMember {
  id: string;
  professionalId: string;
  scopes: PermissionScope[];
  professional: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    phone: string | null;
  };
}

interface Props {
  accessList: TeamMember[];
  isParent: boolean;
  childId: string;
}

export default function TeamMembersList({ accessList, isParent, childId }: Props) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<string | null>(null);

  const handleRevoke = async (professionalId: string) => {
    if (!confirm("Are you sure you want to revoke access for this team member?")) {
      return;
    }

    setRevoking(professionalId);

    try {
      const response = await fetch(`/api/children/${childId}/access/${professionalId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to revoke access");
      }

      router.refresh();
    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Failed to revoke access. Please try again.");
    } finally {
      setRevoking(null);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.CLINICIAN:
        return "medical_services";
      case Role.SUPPORT:
        return "support_agent";
      default:
        return "person";
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.CLINICIAN:
        return "text-lavender-600 dark:text-lavender-400 bg-lavender-100 dark:bg-lavender-900/30";
      case Role.SUPPORT:
        return "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30";
      default:
        return "text-sage-600 dark:text-sage-400 bg-sage-100 dark:bg-sage-800";
    }
  };

  const getScopeIcon = (scope: PermissionScope) => {
    switch (scope) {
      case "MEDICAL_NOTES":
        return "description";
      case "SUPPORT_NOTES":
        return "note";
      case "MESSAGES":
        return "chat";
      case "VIDEO_VISITS":
        return "videocam";
      default:
        return "key";
    }
  };

  if (accessList.length === 0) {
    return (
      <div className="text-center py-6">
        <span className="material-symbols-rounded text-3xl text-sage-300 dark:text-sage-600">
          group
        </span>
        <p className="mt-2 text-sage-600 dark:text-sage-400 text-sm">
          No team members yet
        </p>
        {isParent && (
          <p className="text-xs text-sage-500 dark:text-sage-500 mt-1">
            Invite professionals to start building your care team
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accessList.map((access) => (
        <div
          key={access.professionalId}
          className="p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${getRoleColor(
                  access.professional.role
                )}`}
              >
                <span className="material-symbols-rounded">
                  {getRoleIcon(access.professional.role)}
                </span>
              </div>
              <div>
                <p className="font-medium text-sage-900 dark:text-white">
                  {access.professional.name || "Unknown"}
                </p>
                <p className="text-xs text-sage-500 dark:text-sage-400">
                  {access.professional.role === Role.CLINICIAN
                    ? "Healthcare Professional"
                    : "Support Professional"}
                </p>
              </div>
            </div>
            {isParent && (
              <button
                onClick={() => handleRevoke(access.professionalId)}
                disabled={revoking === access.professionalId}
                className="p-1.5 rounded-lg hover:bg-coral-100 dark:hover:bg-coral-900/30 text-coral-600 dark:text-coral-400 transition-colors"
                title="Revoke access"
              >
                {revoking === access.professionalId ? (
                  <span className="material-symbols-rounded animate-spin text-sm">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-rounded text-sm">
                    person_remove
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Permissions */}
          <div className="mt-3 flex flex-wrap gap-1">
            {access.scopes.map((scope) => (
              <span
                key={scope}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-sage-100 dark:bg-sage-700 text-sage-600 dark:text-sage-300 text-xs"
              >
                <span className="material-symbols-rounded text-xs mr-1">
                  {getScopeIcon(scope)}
                </span>
                {scope.replace("_", " ").toLowerCase()}
              </span>
            ))}
          </div>

          {/* Contact Info */}
          <div className="mt-2 flex items-center text-xs text-sage-500 dark:text-sage-400">
            <span className="material-symbols-rounded text-xs mr-1">mail</span>
            {access.professional.email}
            {access.professional.phone && (
              <>
                <span className="mx-2">•</span>
                <span className="material-symbols-rounded text-xs mr-1">phone</span>
                {access.professional.phone}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
