import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";

export default async function UsersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string; search?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const pageSize = 20;
  const roleFilter = params.role as Role | undefined;
  const searchQuery = params.search;

  // Build where clause
  const where: Record<string, unknown> = {};
  if (roleFilter) where.role = roleFilter;
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { email: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Fetch users
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            children: true,
            accessGrants: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const roleCounts = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  });

  const roleCountMap = Object.fromEntries(
    roleCounts.map((r) => [r.role, r._count])
  );

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
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            User Management
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Manage users and their roles
          </p>
        </div>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.values(Role).map((role) => (
          <Link
            key={role}
            href={`/admin/users?role=${role}`}
            className={`card p-4 transition-all ${
              roleFilter === role
                ? "ring-2 ring-primary-500"
                : "hover:bg-sage-50 dark:hover:bg-sage-800/50"
            }`}
          >
            <p className="text-2xl font-bold text-sage-900 dark:text-white">
              {roleCountMap[role] || 0}
            </p>
            <p className="text-sm text-sage-600 dark:text-sage-400">
              {role === Role.PARENT
                ? "Parents"
                : role === Role.CLINICIAN
                ? "Clinicians"
                : role === Role.SUPPORT
                ? "Support"
                : role === Role.ADMIN
                ? "Admins"
                : role === Role.CHILD
                ? "Children"
                : role}
            </p>
          </Link>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <form className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-50">
            <input
              type="text"
              name="search"
              placeholder="Search by name or email..."
              defaultValue={searchQuery || ""}
              className="input-field"
            />
          </div>

          <div className="w-50">
            <select
              name="role"
              defaultValue={roleFilter || ""}
              className="input-field"
            >
              <option value="">All Roles</option>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button type="submit" className="btn-primary">
              <span className="material-symbols-rounded mr-2">search</span>
              Search
            </button>
            {(roleFilter || searchQuery) && (
              <Link href="/admin/users" className="btn-secondary">
                Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50 dark:bg-sage-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  User
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  Children / Access
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-sage-600 dark:text-sage-400">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-sage-600 dark:text-sage-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 dark:divide-sage-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-sage-50 dark:hover:bg-sage-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-medium text-sage-900 dark:text-white">
                          {user.name || "Unnamed"}
                        </p>
                        <p className="text-sm text-sage-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
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
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role === Role.PARENT ? (
                      <span className="text-sm text-sage-600 dark:text-sage-400">
                        {user._count.children} children
                      </span>
                    ) : user.role === Role.CLINICIAN ||
                      user.role === Role.SUPPORT ? (
                      <span className="text-sm text-sage-600 dark:text-sage-400">
                        {user._count.accessGrants} patients
                      </span>
                    ) : (
                      <span className="text-sm text-sage-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-sage-600 dark:text-sage-400">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="p-12 text-center">
            <span className="material-symbols-rounded text-4xl text-sage-400 mb-4">
              person_search
            </span>
            <p className="text-sage-600 dark:text-sage-400">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-sage-600 dark:text-sage-400">
            Showing {(page - 1) * pageSize + 1} -{" "}
            {Math.min(page * pageSize, totalCount)} of {totalCount} users
          </p>
          <div className="flex items-center space-x-2">
            {page > 1 && (
              <Link
                href={`/admin/users?page=${page - 1}${
                  roleFilter ? `&role=${roleFilter}` : ""
                }${searchQuery ? `&search=${searchQuery}` : ""}`}
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
                href={`/admin/users?page=${page + 1}${
                  roleFilter ? `&role=${roleFilter}` : ""
                }${searchQuery ? `&search=${searchQuery}` : ""}`}
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
