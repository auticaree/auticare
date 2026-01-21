import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";

async function getDashboardData(userId: string, role: Role) {
  switch (role) {
    case Role.PARENT:
      const children = await prisma.childProfile.findMany({
        where: { parentId: userId },
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
        },
      });
      const parentMessages = await prisma.message.count({
        where: {
          thread: {
            participants: { some: { userId: userId } },
          },
          senderId: { not: userId },
          // Count messages newer than user's lastReadAt
          createdAt: {
            gt: await prisma.threadParticipant
              .findFirst({
                where: { userId: userId },
                orderBy: { lastReadAt: "desc" },
                select: { lastReadAt: true },
              })
              .then((p) => p?.lastReadAt || new Date(0)),
          },
        },
      });
      const upcomingVisits = await prisma.videoVisit.findMany({
        where: {
          participants: { some: { userId: userId } },
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        take: 3,
      });
      return { children, unreadMessages: parentMessages, upcomingVisits };

    case Role.CLINICIAN:
    case Role.SUPPORT:
      const patients = await prisma.childAccess.findMany({
        where: { professionalId: userId, isActive: true },
        include: {
          child: {
            include: {
              parent: { select: { id: true, name: true } },
            },
          },
        },
        take: 5,
      });
      const profMessages = await prisma.message.count({
        where: {
          thread: { participants: { some: { userId: userId } } },
          senderId: { not: userId },
          // Count messages newer than user's lastReadAt
          createdAt: {
            gt: await prisma.threadParticipant
              .findFirst({
                where: { userId: userId },
                orderBy: { lastReadAt: "desc" },
                select: { lastReadAt: true },
              })
              .then((p) => p?.lastReadAt || new Date(0)),
          },
        },
      });
      const profVisits = await prisma.videoVisit.findMany({
        where: {
          participants: { some: { userId: userId } },
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: "asc" },
        take: 3,
      });
      return { patients, unreadMessages: profMessages, upcomingVisits: profVisits };

    default:
      return { unreadMessages: 0, upcomingVisits: [] };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { user } = session;
  const data = await getDashboardData(user.id!, user.role as Role);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
              Welcome back, {user.name?.split(" ")[0]}!
            </h1>
            <p className="text-sage-600 dark:text-sage-400 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-primary-100 dark:bg-primary-900/30">
            <span className="material-symbols-rounded text-primary-600 dark:text-primary-400">
              verified_user
            </span>
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Secure Connection
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-rounded text-primary-500">chat</span>
            <span className="badge badge-primary">{data.unreadMessages} new</span>
          </div>
          <p className="text-2xl font-semibold text-sage-900 dark:text-white">
            Messages
          </p>
          <Link
            href="/messages"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block"
          >
            View all →
          </Link>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="material-symbols-rounded text-coral-500">videocam</span>
            <span className="badge badge-coral">{data.upcomingVisits?.length || 0}</span>
          </div>
          <p className="text-2xl font-semibold text-sage-900 dark:text-white">
            Visits
          </p>
          <Link
            href="/video"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1 inline-block"
          >
            Schedule →
          </Link>
        </div>

        {user.role === "PARENT" && (
          <>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-rounded text-lavender-500">
                  child_care
                </span>
              </div>
              <p className="text-2xl font-semibold text-sage-900 dark:text-white">
                {"children" in data ? data.children?.length || 0 : 0}
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Child Profiles
              </p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-rounded text-teal-500">groups</span>
              </div>
              <p className="text-2xl font-semibold text-sage-900 dark:text-white">
                {"children" in data
                  ? data.children?.reduce(
                    (acc, child) => acc + (child.accessList?.length || 0),
                    0
                  ) || 0
                  : 0}
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Care Team Members
              </p>
            </div>
          </>
        )}

        {(user.role === "CLINICIAN" || user.role === "SUPPORT") && (
          <>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-rounded text-lavender-500">
                  group
                </span>
              </div>
              <p className="text-2xl font-semibold text-sage-900 dark:text-white">
                {"patients" in data ? data.patients?.length || 0 : 0}
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Active Patients
              </p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-rounded text-teal-500">
                  description
                </span>
              </div>
              <p className="text-2xl font-semibold text-sage-900 dark:text-white">
                0
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Notes Today
              </p>
            </div>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Visits */}
          <div className="card">
            <div className="p-4 border-b border-sage-100 dark:border-sage-800 flex items-center justify-between">
              <h2 className="font-semibold text-sage-900 dark:text-white">
                Upcoming Visits
              </h2>
              <Link
                href="/video"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="p-4">
              {data.upcomingVisits && data.upcomingVisits.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-coral-100 dark:bg-coral-900/30 flex items-center justify-center">
                          <span className="material-symbols-rounded text-coral-600 dark:text-coral-400">
                            videocam
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sage-900 dark:text-white">
                            {visit.title}
                          </p>
                          <p className="text-sm text-sage-500 dark:text-sage-400">
                            {visit.scheduledAt
                              ? new Date(visit.scheduledAt).toLocaleString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                              : "Not scheduled"}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/video/${visit.id}`}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        Join
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-rounded text-4xl text-sage-300 dark:text-sage-600">
                    event_busy
                  </span>
                  <p className="mt-2 text-sage-600 dark:text-sage-400">
                    No upcoming visits scheduled
                  </p>
                  <Link
                    href="/video/schedule"
                    className="btn-primary mt-4 inline-flex"
                  >
                    <span className="material-symbols-rounded mr-2">add</span>
                    Schedule Visit
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Children/Patients List */}
          {user.role === "PARENT" && "children" in data && (
            <div className="card">
              <div className="p-4 border-b border-sage-100 dark:border-sage-800 flex items-center justify-between">
                <h2 className="font-semibold text-sage-900 dark:text-white">
                  Your Children
                </h2>
                <Link
                  href="/children/add"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                >
                  <span className="material-symbols-rounded text-sm mr-1">add</span>
                  Add Child
                </Link>
              </div>
              <div className="p-4">
                {data.children && data.children.length > 0 ? (
                  <div className="space-y-3">
                    {data.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/children/${child.id}`}
                        className="flex items-center justify-between p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-medium text-lg">
                            {child.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sage-900 dark:text-white">
                              {child.name}
                            </p>
                            <p className="text-sm text-sage-500 dark:text-sage-400">
                              {child.accessList?.length || 0} team members
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {child.gardenProgress && (
                            <div className="flex items-center px-2 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                              <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-sm mr-1">
                                psychiatry
                              </span>
                              <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                                {child.gardenProgress.totalPoints || 0} pts
                              </span>
                            </div>
                          )}
                          <span className="material-symbols-rounded text-sage-400">
                            chevron_right
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-rounded text-4xl text-sage-300 dark:text-sage-600">
                      child_care
                    </span>
                    <p className="mt-2 text-sage-600 dark:text-sage-400">
                      No children added yet
                    </p>
                    <Link
                      href="/children/add"
                      className="btn-primary mt-4 inline-flex"
                    >
                      <span className="material-symbols-rounded mr-2">add</span>
                      Add Child Profile
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {(user.role === "CLINICIAN" || user.role === "SUPPORT") &&
            "patients" in data && (
              <div className="card">
                <div className="p-4 border-b border-sage-100 dark:border-sage-800 flex items-center justify-between">
                  <h2 className="font-semibold text-sage-900 dark:text-white">
                    Recent Patients
                  </h2>
                  <Link
                    href="/patients"
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="p-4">
                  {data.patients && data.patients.length > 0 ? (
                    <div className="space-y-3">
                      {data.patients.map((access) => (
                        <Link
                          key={access.childId}
                          href={`/patients/${access.childId}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-lavender-400 to-lavender-600 flex items-center justify-center text-white font-medium text-lg">
                              {access.child.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-sage-900 dark:text-white">
                                {access.child.name}
                              </p>
                              <p className="text-sm text-sage-500 dark:text-sage-400">
                                Parent: {access.child.parent?.name}
                              </p>
                            </div>
                          </div>
                          <span className="material-symbols-rounded text-sage-400">
                            chevron_right
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-rounded text-4xl text-sage-300 dark:text-sage-600">
                        group
                      </span>
                      <p className="mt-2 text-sage-600 dark:text-sage-400">
                        No patients assigned yet
                      </p>
                      <p className="text-sm text-sage-500 dark:text-sage-500 mt-1">
                        Patients will appear here when families invite you.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/messages/new"
                className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
              >
                <span className="material-symbols-rounded text-primary-500 mr-3">
                  edit
                </span>
                <span className="text-sage-700 dark:text-sage-300">
                  New Message
                </span>
              </Link>
              <Link
                href="/video/schedule"
                className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
              >
                <span className="material-symbols-rounded text-coral-500 mr-3">
                  video_call
                </span>
                <span className="text-sage-700 dark:text-sage-300">
                  Schedule Visit
                </span>
              </Link>
              {(user.role === "CLINICIAN" || user.role === "SUPPORT") && (
                <Link
                  href="/notes/new"
                  className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
                >
                  <span className="material-symbols-rounded text-lavender-500 mr-3">
                    note_add
                  </span>
                  <span className="text-sage-700 dark:text-sage-300">
                    Add Note
                  </span>
                </Link>
              )}
              {user.role === "PARENT" && (
                <Link
                  href="/children/add"
                  className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
                >
                  <span className="material-symbols-rounded text-teal-500 mr-3">
                    person_add
                  </span>
                  <span className="text-sage-700 dark:text-sage-300">
                    Add Child
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Garden Preview (for parents) */}
          {user.role === "PARENT" &&
            "children" in data &&
            data.children &&
            data.children.length > 0 && (
              <div className="card overflow-hidden">
                <div className="p-4 bg-linear-to-br from-primary-400 to-teal-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Garden Progress</h3>
                      <p className="text-sm text-white/80 mt-1">
                        {data.children[0].name}&apos;s garden is growing!
                      </p>
                    </div>
                    <span className="material-symbols-rounded text-3xl">
                      psychiatry
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-sage-600 dark:text-sage-400">
                      Total Points
                    </span>
                    <span className="font-semibold text-sage-900 dark:text-white">
                      {data.children[0].gardenProgress?.totalPoints || 0}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-sage-100 dark:bg-sage-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-primary-400 to-teal-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          ((data.children[0].gardenProgress?.totalPoints || 0) / 100) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <Link
                    href={`/garden/${data.children[0].id}`}
                    className="btn-secondary w-full mt-4 justify-center"
                  >
                    View Garden
                  </Link>
                </div>
              </div>
            )}

          {/* Help Card */}
          <div className="card p-4 bg-linear-to-br from-sage-50 to-primary-50 dark:from-sage-800 dark:to-primary-900/20">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-primary-600 dark:text-primary-400">
                  help
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sage-900 dark:text-white">
                  Need Help?
                </h3>
                <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">
                  Check out our guides and tutorials to get the most out of
                  AutiCare.
                </p>
                <Link
                  href="/help"
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline mt-2 inline-block"
                >
                  View Resources →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
