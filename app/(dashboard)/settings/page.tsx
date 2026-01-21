import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const settingsGroups = [
    {
      title: "Account",
      items: [
        {
          icon: "person",
          label: "Profile",
          description: "Update your personal information",
          href: "/settings/profile",
        },
        {
          icon: "lock",
          label: "Security",
          description: "Password and authentication",
          href: "/settings/security",
        },
        {
          icon: "notifications",
          label: "Notifications",
          description: "Manage notification preferences",
          href: "/settings/notifications",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "palette",
          label: "Appearance",
          description: "Theme and display settings",
          href: "/settings/appearance",
        },
        {
          icon: "accessibility",
          label: "Accessibility",
          description: "Accessibility features",
          href: "/settings/accessibility",
        },
        {
          icon: "language",
          label: "Language",
          description: "Language preferences",
          href: "/settings/language",
        },
      ],
    },
    {
      title: "Privacy & Data",
      items: [
        {
          icon: "shield",
          label: "Privacy",
          description: "Data sharing and privacy",
          href: "/settings/privacy",
        },
        {
          icon: "download",
          label: "Export Data",
          description: "Download your data",
          href: "/settings/export",
        },
      ],
    },
  ];

  // Admin-only settings
  if (user.role === Role.ADMIN) {
    settingsGroups.push({
      title: "Administration",
      items: [
        {
          icon: "admin_panel_settings",
          label: "Admin Console",
          description: "System administration",
          href: "/admin",
        },
        {
          icon: "history",
          label: "Audit Logs",
          description: "View system audit logs",
          href: "/admin/audit",
        },
        {
          icon: "group",
          label: "User Management",
          description: "Manage users and roles",
          href: "/admin/users",
        },
      ],
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sage-600 dark:text-sage-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* User Card */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-sage-900 dark:text-white">
              {user.name}
            </h2>
            <p className="text-sage-600 dark:text-sage-400">{user.email}</p>
            <div className="flex items-center mt-2 space-x-2">
              <span
                className={`badge ${
                  user.role === Role.ADMIN
                    ? "badge-coral"
                    : user.role === Role.CLINICIAN
                    ? "badge-lavender"
                    : user.role === Role.SUPPORT
                    ? "badge-teal"
                    : "badge-primary"
                }`}
              >
                {user.role === Role.PARENT
                  ? "Parent"
                  : user.role === Role.CLINICIAN
                  ? "Healthcare Clinician"
                  : user.role === Role.SUPPORT
                  ? "Support Professional"
                  : user.role === Role.ADMIN
                  ? "Administrator"
                  : user.role}
              </span>
              <span className="text-sm text-sage-500">
                Member since{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <Link
            href="/settings/profile"
            className="btn-secondary text-sm"
          >
            <span className="material-symbols-rounded text-sm mr-1">edit</span>
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Settings Groups */}
      {settingsGroups.map((group) => (
        <div key={group.title} className="space-y-3">
          <h3 className="text-sm font-medium text-sage-500 dark:text-sage-400 uppercase tracking-wider px-1">
            {group.title}
          </h3>
          <div className="card divide-y divide-sage-100 dark:divide-sage-800">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center p-4 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-800 flex items-center justify-center mr-4">
                  <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                    {item.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sage-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="text-sm text-sage-500 dark:text-sage-400">
                    {item.description}
                  </p>
                </div>
                <span className="material-symbols-rounded text-sage-400">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Danger Zone */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-coral-500 uppercase tracking-wider px-1">
          Danger Zone
        </h3>
        <div className="card border-coral-200 dark:border-coral-800/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Delete Account
              </p>
              <p className="text-sm text-sage-500 dark:text-sage-400">
                Permanently delete your account and all data
              </p>
            </div>
            <button className="px-4 py-2 rounded-xl border border-coral-300 dark:border-coral-700 text-coral-600 dark:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-900/20 transition-colors text-sm font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-sage-500 dark:text-sage-400 pb-6">
        <p>AutiCare v1.0.0 (Pilot)</p>
        <p className="mt-1">
          <Link href="/help" className="hover:text-primary-500">
            Help & Support
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-primary-500">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="hover:text-primary-500">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
