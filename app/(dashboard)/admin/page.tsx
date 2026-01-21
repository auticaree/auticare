import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  // Fetch statistics
  const [
    totalUsers,
    totalChildren,
    totalNotes,
    totalVisits,
    recentUsers,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.childProfile.count(),
    Promise.all([
      prisma.medicalNote.count(),
      prisma.supportNote.count(),
    ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
    prisma.videoVisit.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: "group", color: "primary" },
    { label: "Children", value: totalChildren, icon: "child_care", color: "teal" },
    { label: "Clinical Notes", value: totalNotes, icon: "description", color: "lavender" },
    { label: "Video Visits", value: totalVisits, icon: "videocam", color: "coral" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Admin Console
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mt-1">
            System overview and management
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary">
          <span className="material-symbols-rounded mr-2">arrow_back</span>
          Back to Dashboard
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sage-600 dark:text-sage-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-sage-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === "primary"
                    ? "bg-primary-100 dark:bg-primary-900/30"
                    : stat.color === "teal"
                      ? "bg-teal-100 dark:bg-teal-900/30"
                      : stat.color === "lavender"
                        ? "bg-lavender-100 dark:bg-lavender-900/30"
                        : "bg-coral-100 dark:bg-coral-900/30"
                  }`}
              >
                <span
                  className={`material-symbols-rounded text-2xl ${stat.color === "primary"
                      ? "text-primary-600 dark:text-primary-400"
                      : stat.color === "teal"
                        ? "text-teal-600 dark:text-teal-400"
                        : stat.color === "lavender"
                          ? "text-lavender-600 dark:text-lavender-400"
                          : "text-coral-600 dark:text-coral-400"
                    }`}
                >
                  {stat.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className="card p-6 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-2xl">
                group
              </span>
            </div>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                User Management
              </p>
              <p className="text-sm text-sage-500">Manage users and roles</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/audit"
          className="card p-6 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center">
              <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400 text-2xl">
                history
              </span>
            </div>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Audit Logs
              </p>
              <p className="text-sm text-sage-500">View system activity</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/reports"
          className="card p-6 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <span className="material-symbols-rounded text-teal-600 dark:text-teal-400 text-2xl">
                analytics
              </span>
            </div>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Reports
              </p>
              <p className="text-sm text-sage-500">System analytics</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-sage-900 dark:text-white">
              Recent Users
            </h3>
            <Link
              href="/admin/users"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-sage-50 dark:bg-sage-800 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-bold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-sage-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-sm text-sage-500">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`badge ${user.role === Role.ADMIN
                      ? "badge-coral"
                      : user.role === Role.CLINICIAN
                        ? "badge-lavender"
                        : user.role === Role.SUPPORT
                          ? "badge-teal"
                          : "badge-primary"
                    }`}
                >
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-sage-900 dark:text-white">
              Recent Activity
            </h3>
            <Link
              href="/admin/audit"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 bg-sage-50 dark:bg-sage-800 rounded-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-sage-200 dark:bg-sage-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded text-sage-600 dark:text-sage-400 text-sm">
                    {log.action.includes("CREATE")
                      ? "add"
                      : log.action.includes("DELETE")
                        ? "delete"
                        : log.action.includes("UPDATE") || log.action.includes("CHANGE")
                          ? "edit"
                          : log.action.includes("LOGIN")
                            ? "login"
                            : "history"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sage-900 dark:text-white">
                    {log.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-sage-500 truncate">
                    {log.user?.name || log.user?.email || "System"} ·{" "}
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
