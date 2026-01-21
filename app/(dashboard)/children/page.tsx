import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";

export default async function ChildrenListPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== Role.PARENT) {
    redirect("/dashboard");
  }

  const children = await prisma.childProfile.findMany({
    where: { parentId: session.user.id },
    include: {
      gardenProgress: true,
      accessList: {
        where: { isActive: true },
        include: {
          professional: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      _count: {
        select: {
          medicalNotes: true,
          supportNotes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Your Children
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Manage profiles and care teams for your children
          </p>
        </div>
        <Link href="/children/add" className="btn-primary">
          <span className="material-symbols-rounded mr-2">add</span>
          Add Child
        </Link>
      </div>

      {/* Children Grid */}
      {children.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const age = Math.floor(
              (Date.now() - new Date(child.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            );

            return (
              <Link
                key={child.id}
                href={`/children/${child.id}`}
                className="card group hover:shadow-lg transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-semibold text-xl shadow-glow group-hover:scale-105 transition-transform">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sage-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {child.name}
                      </h3>
                      <p className="text-sm text-sage-500 dark:text-sage-400">
                        {age} years old
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 rounded-lg bg-sage-50 dark:bg-sage-800/50">
                      <p className="text-lg font-semibold text-sage-900 dark:text-white">
                        {child.accessList.length}
                      </p>
                      <p className="text-xs text-sage-500 dark:text-sage-400">
                        Team
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-sage-50 dark:bg-sage-800/50">
                      <p className="text-lg font-semibold text-sage-900 dark:text-white">
                        {child._count.medicalNotes + child._count.supportNotes}
                      </p>
                      <p className="text-xs text-sage-500 dark:text-sage-400">
                        Notes
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                      <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                        {child.gardenProgress?.totalPoints || 0}
                      </p>
                      <p className="text-xs text-sage-500 dark:text-sage-400">
                        Points
                      </p>
                    </div>
                  </div>

                  {/* Garden Progress */}
                  {child.gardenProgress && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-sage-500 dark:text-sage-400">
                          Garden Level: {child.gardenProgress.plantLevel}
                        </span>
                        <span className="text-xs text-sage-500 dark:text-sage-400">
                          {child.gardenProgress.growthPoints}/{child.gardenProgress.totalPoints}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-sage-100 dark:bg-sage-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-primary-400 to-teal-500 rounded-full"
                          style={{
                            width: `${(child.gardenProgress.growthPoints / child.gardenProgress.totalPoints) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Team Members Preview */}
                  {child.accessList.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-sage-100 dark:border-sage-800">
                      <p className="text-xs text-sage-500 dark:text-sage-400 mb-2">
                        Care Team
                      </p>
                      <div className="flex -space-x-2">
                        {child.accessList.slice(0, 4).map((access) => (
                          <div
                            key={access.professionalId}
                            className="w-8 h-8 rounded-full bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center text-lavender-600 dark:text-lavender-400 text-xs font-medium border-2 border-white dark:border-sage-900"
                            title={access.professional.name || "Unknown"}
                          >
                            {access.professional.name?.charAt(0) || "?"}
                          </div>
                        ))}
                        {child.accessList.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-sage-800 flex items-center justify-center text-sage-600 dark:text-sage-400 text-xs font-medium border-2 border-white dark:border-sage-900">
                            +{child.accessList.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-sage-100 dark:bg-sage-800 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-4xl text-sage-400">
              child_care
            </span>
          </div>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            No children added yet
          </h3>
          <p className="text-sage-600 dark:text-sage-400 mb-6 max-w-md mx-auto">
            Create a profile for your child to start building their care team
            and tracking progress.
          </p>
          <Link href="/children/add" className="btn-primary inline-flex">
            <span className="material-symbols-rounded mr-2">add</span>
            Add Your First Child
          </Link>
        </div>
      )}
    </div>
  );
}
