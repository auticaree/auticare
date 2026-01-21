import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";
import VisitStatusManager from "./visit-status-manager";

export default async function VideoVisitsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = session.user.role as Role;

  // Get video visits based on role
  let visits;
  if (userRole === Role.PARENT) {
    const children = await prisma.childProfile.findMany({
      where: { parentId: session.user.id },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    
    visits = await prisma.videoVisit.findMany({
      where: { childId: { in: childIds } },
      include: {
        child: { select: { id: true, name: true, parentId: true } },
        host: { select: { id: true, name: true, role: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });
  } else if (userRole === Role.CLINICIAN || userRole === Role.SUPPORT) {
    visits = await prisma.videoVisit.findMany({
      where: { hostId: session.user.id },
      include: {
        child: { select: { id: true, name: true, parentId: true } },
        host: { select: { id: true, name: true, role: true } },
      },
      orderBy: { scheduledAt: "desc" },
    });
  } else {
    visits = await prisma.videoVisit.findMany({
      include: {
        child: { select: { id: true, name: true, parentId: true } },
        host: { select: { id: true, name: true, role: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });
  }

  const now = new Date();
  const upcomingVisits = visits.filter((v) => v.scheduledAt && new Date(v.scheduledAt) > now && v.status !== "CANCELLED");
  const pastVisits = visits.filter((v) => v.scheduledAt && (new Date(v.scheduledAt) <= now || v.status === "COMPLETED"));
  const cancelledVisits = visits.filter((v) => v.status === "CANCELLED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Video Consultations
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Schedule and manage video appointments
          </p>
        </div>
        <Link href="/video/schedule" className="btn-primary">
          <span className="material-symbols-rounded mr-2">video_call</span>
          Schedule Visit
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Upcoming", value: upcomingVisits.length, icon: "event", color: "primary" },
          { label: "Completed", value: pastVisits.filter((v) => v.status === "COMPLETED").length, icon: "check_circle", color: "teal" },
          { label: "In Progress", value: visits.filter((v) => v.status === "IN_PROGRESS").length, icon: "videocam", color: "lavender" },
          { label: "Cancelled", value: cancelledVisits.length, icon: "cancel", color: "sage" },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                <span className={`material-symbols-rounded text-${stat.color}-600 dark:text-${stat.color}-400`}>
                  {stat.icon}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-sage-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-sage-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Visits */}
      <section>
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
          Upcoming Appointments
        </h2>
        {upcomingVisits.length > 0 ? (
          <div className="space-y-3">
            {upcomingVisits.map((visit) => {
              const visitDate = visit.scheduledAt ? new Date(visit.scheduledAt) : new Date();
              const isToday = visitDate.toDateString() === now.toDateString();
              const isSoon = visitDate.getTime() - now.getTime() < 30 * 60 * 1000; // within 30 min
              
              return (
                <div
                  key={visit.id}
                  className={`card p-4 transition-all ${
                    isSoon
                      ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "hover:shadow-lg"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/video/${visit.id}`}
                      className="flex items-center space-x-4 flex-1"
                    >
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                        isToday
                          ? "bg-primary-100 dark:bg-primary-900/30"
                          : "bg-sage-100 dark:bg-sage-800"
                      }`}>
                        <span className={`text-xs font-medium ${
                          isToday
                            ? "text-primary-600 dark:text-primary-400"
                            : "text-sage-500"
                        }`}>
                          {visitDate.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                        <span className={`text-xl font-bold ${
                          isToday
                            ? "text-primary-700 dark:text-primary-300"
                            : "text-sage-700 dark:text-sage-300"
                        }`}>
                          {visitDate.getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sage-900 dark:text-white">
                            {userRole === Role.PARENT
                              ? `${visit.host.name}`
                              : visit.child.name}
                          </span>
                          {isSoon && (
                            <span className="badge badge-primary animate-pulse">
                              Starting Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-sage-500">
                          {visitDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          • 30 minutes
                        </p>
                        {visit.reason && (
                          <p className="text-sm text-sage-600 dark:text-sage-400 mt-1 line-clamp-1">
                            {visit.reason}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center space-x-2">
                      {isSoon && (
                        <Link href={`/video/${visit.id}`} className="btn-primary">
                          <span className="material-symbols-rounded mr-2">videocam</span>
                          Join
                        </Link>
                      )}
                      <VisitStatusManager
                        visitId={visit.id}
                        currentStatus={visit.status}
                        visitTitle={visit.title}
                        childName={visit.child.name}
                        canManage={visit.hostId === session.user.id || visit.child.parentId === session.user.id || userRole === Role.ADMIN}
                      />
                      <Link href={`/video/${visit.id}`}>
                        <span className="material-symbols-rounded text-sage-400">
                          chevron_right
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <span className="material-symbols-rounded text-4xl text-sage-400 mb-3">
              event_busy
            </span>
            <p className="text-sage-600 dark:text-sage-400">
              No upcoming appointments scheduled.
            </p>
            <Link href="/video/schedule" className="btn-primary inline-flex mt-4">
              <span className="material-symbols-rounded mr-2">add</span>
              Schedule Now
            </Link>
          </div>
        )}
      </section>

      {/* Past Visits */}
      {pastVisits.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
            Past Appointments
          </h2>
          <div className="space-y-3">
            {pastVisits.slice(0, 10).map((visit) => {
              const visitDate = visit.scheduledAt ? new Date(visit.scheduledAt) : new Date();
              
              return (
                <Link
                  key={visit.id}
                  href={`/video/${visit.id}`}
                  className="card p-4 block hover:shadow-lg transition-shadow opacity-80"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-sage-800 flex items-center justify-center">
                        <span className="material-symbols-rounded text-sage-500">
                          {visit.status === "COMPLETED" ? "check_circle" : "schedule"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-sage-700 dark:text-sage-300">
                          {userRole === Role.PARENT
                            ? `${visit.host.name}`
                            : visit.child.name}
                        </span>
                        <p className="text-sm text-sage-500">
                          {visitDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at{" "}
                          {visitDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        visit.status === "COMPLETED"
                          ? "badge-teal"
                          : "badge-sage"
                      }`}
                    >
                      {visit.status === "COMPLETED" ? "Completed" : visit.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
