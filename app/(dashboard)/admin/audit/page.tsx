import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; user?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const actionFilter = params.action;
  const userFilter = params.user;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (actionFilter) where.action = { contains: actionFilter };
  if (userFilter) where.userId = userFilter;

  // Fetch audit logs
  const [logs, totalCount, uniqueActions, uniqueUsers] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({
      by: ["action"],
      orderBy: { action: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/admin"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Audit Logs
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            System activity and security events
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-50">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
              Action Type
            </label>
            <select
              name="action"
              defaultValue={actionFilter || ""}
              className="input-field"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((a) => (
                <option key={a.action} value={a.action}>
                  {a.action.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-50">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
              User
            </label>
            <select
              name="user"
              defaultValue={userFilter || ""}
              className="input-field"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              <span className="material-symbols-rounded mr-2">filter_list</span>
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50 dark:bg-sage-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 dark:divide-sage-800">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-sage-50 dark:hover:bg-sage-800/50"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm text-sage-900 dark:text-white">
                      {new Date(log.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-sage-500">
                      {new Date(log.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-sage-900 dark:text-white">
                      {log.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-sage-500">
                      {log.user?.email || log.userId}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        log.action.includes("CREATE")
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                          : log.action.includes("DELETE")
                          ? "bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300"
                          : log.action.includes("UPDATE") ||
                            log.action.includes("CHANGE")
                          ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                          : "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300"
                      }`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-sage-900 dark:text-white">
                      {log.targetType || "-"}
                    </p>
                    <p className="text-xs text-sage-500 font-mono truncate max-w-37.5">
                      {log.targetId || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {log.metadata ? (
                      <button
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        title={log.metadata}
                      >
                        View details
                      </button>
                    ) : (
                      <span className="text-sm text-sage-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="p-12 text-center">
            <span className="material-symbols-rounded text-4xl text-sage-400 mb-4">
              history
            </span>
            <p className="text-sage-600 dark:text-sage-400">
              No audit logs found
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-sage-600 dark:text-sage-400">
            Showing {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center space-x-2">
            {page > 1 && (
              <Link
                href={`/admin/audit?page=${page - 1}${
                  actionFilter ? `&action=${actionFilter}` : ""
                }${userFilter ? `&user=${userFilter}` : ""}`}
                className="btn-secondary text-sm"
              >
                Previous
              </Link>
            )}
            <span className="px-3 py-1 text-sm text-sage-600 dark:text-sage-400">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/admin/audit?page=${page + 1}${
                  actionFilter ? `&action=${actionFilter}` : ""
                }${userFilter ? `&user=${userFilter}` : ""}`}
                className="btn-secondary text-sm"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
