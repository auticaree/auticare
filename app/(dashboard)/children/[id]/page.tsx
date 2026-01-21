import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";
import InviteTeamMember from "./invite-team-member";
import TeamMembersList from "./team-members-list";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChildProfilePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  // Fetch child profile with access check
  const child = await prisma.childProfile.findUnique({
    where: { id },
    include: {
      parent: {
        select: { id: true, name: true, email: true },
      },
      gardenProgress: {
        include: {
          tasks: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      accessList: {
        where: { isActive: true },
        include: {
          professional: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              phone: true,
            },
          },
        },
      },
      medicalNotes: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      },
      supportNotes: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
  });

  if (!child) notFound();

  // Access check
  const isParent = child.parentId === session.user.id;
  const isProfessional = child.accessList.some(
    (access) => access.professionalId === session.user.id
  );

  if (!isParent && !isProfessional && session.user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  // Calculate age
  const age = Math.floor(
    (Date.now() - new Date(child.dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={isParent ? "/children" : "/patients"}
            className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
          >
            <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
              arrow_back
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-semibold text-2xl shadow-glow">
              {child.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
                {child.name}
              </h1>
              <p className="text-sage-600 dark:text-sage-400">
                {age} years old • {child.timezone}
              </p>
            </div>
          </div>
        </div>

        {isParent && (
          <Link href={`/children/${id}/edit`} className="btn-secondary">
            <span className="material-symbols-rounded mr-2">edit</span>
            Edit Profile
          </Link>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Garden Card */}
          {child.gardenProgress && (
            <div className="card overflow-hidden">
              <div className="p-4 bg-linear-to-br from-primary-400 to-teal-500 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Garden Progress</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Plant Level: {child.gardenProgress.plantLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">
                      {child.gardenProgress.totalPoints}
                    </p>
                    <p className="text-sm text-white/80">Total Points</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-sage-600 dark:text-sage-400">
                    Progress to next level
                  </span>
                  <span className="text-sm font-medium text-sage-900 dark:text-white">
                    {child.gardenProgress.growthPoints}/{child.gardenProgress.totalPoints} points
                  </span>
                </div>
                <div className="w-full h-3 bg-sage-100 dark:bg-sage-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-primary-400 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${(child.gardenProgress.growthPoints / child.gardenProgress.totalPoints) * 100}%` }}
                  />
                </div>
                <Link
                  href={`/garden/${child.id}`}
                  className="btn-primary w-full mt-4 justify-center"
                >
                  <span className="material-symbols-rounded mr-2">
                    psychiatry
                  </span>
                  Open Garden
                </Link>
              </div>
            </div>
          )}

          {/* Recent Medical Notes */}
          <div className="card">
            <div className="p-4 border-b border-sage-100 dark:border-sage-800 flex items-center justify-between">
              <h2 className="font-semibold text-sage-900 dark:text-white">
                Recent Medical Notes
              </h2>
              <Link
                href={`/notes?child=${id}&type=medical`}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="p-4">
              {child.medicalNotes.length > 0 ? (
                <div className="space-y-3">
                  {child.medicalNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="block p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="badge badge-lavender">
                          {note.noteType}
                        </span>
                        <span className="text-xs text-sage-500 dark:text-sage-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-sage-700 dark:text-sage-300 line-clamp-2">
                        {note.subjective || note.assessment || "No summary"}
                      </p>
                      <p className="text-xs text-sage-500 dark:text-sage-400 mt-1">
                        By {note.author.name}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="material-symbols-rounded text-3xl text-sage-300 dark:text-sage-600">
                    description
                  </span>
                  <p className="mt-2 text-sage-600 dark:text-sage-400 text-sm">
                    No medical notes yet
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Support Notes */}
          <div className="card">
            <div className="p-4 border-b border-sage-100 dark:border-sage-800 flex items-center justify-between">
              <h2 className="font-semibold text-sage-900 dark:text-white">
                Recent Support Notes
              </h2>
              <Link
                href={`/notes?child=${id}&type=support`}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="p-4">
              {child.supportNotes.length > 0 ? (
                <div className="space-y-3">
                  {child.supportNotes.map((note) => (
                    <Link
                      key={note.id}
                      href={`/notes/${note.id}`}
                      className="block p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="badge badge-teal">Support</span>
                        <span className="text-xs text-sage-500 dark:text-sage-400">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-sage-700 dark:text-sage-300 line-clamp-2">
                        {note.sessionSummary || note.observations || "No summary"}
                      </p>
                      <p className="text-xs text-sage-500 dark:text-sage-400 mt-1">
                        By {note.author.name}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="material-symbols-rounded text-3xl text-sage-300 dark:text-sage-600">
                    note
                  </span>
                  <p className="mt-2 text-sage-600 dark:text-sage-400 text-sm">
                    No support notes yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Profile Info */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-4">
              Profile Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-sage-100 dark:border-sage-800">
                <span className="text-sm text-sage-600 dark:text-sage-400">
                  Date of Birth
                </span>
                <span className="text-sm font-medium text-sage-900 dark:text-white">
                  {new Date(child.dateOfBirth).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-sage-100 dark:border-sage-800">
                <span className="text-sm text-sage-600 dark:text-sage-400">
                  Age
                </span>
                <span className="text-sm font-medium text-sage-900 dark:text-white">
                  {age} years old
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-sage-100 dark:border-sage-800">
                <span className="text-sm text-sage-600 dark:text-sage-400">
                  Timezone
                </span>
                <span className="text-sm font-medium text-sage-900 dark:text-white">
                  {child.timezone}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-sage-600 dark:text-sage-400">
                  Parent
                </span>
                <span className="text-sm font-medium text-sage-900 dark:text-white">
                  {child.parent.name}
                </span>
              </div>
            </div>
            {child.notes && (
              <div className="mt-4 pt-4 border-t border-sage-100 dark:border-sage-800">
                <p className="text-sm text-sage-600 dark:text-sage-400 mb-1">
                  Notes
                </p>
                <p className="text-sm text-sage-700 dark:text-sage-300">
                  {child.notes}
                </p>
              </div>
            )}
          </div>

          {/* Care Team */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sage-900 dark:text-white">
                Care Team
              </h3>
              {isParent && (
                <InviteTeamMember childId={id} />
              )}
            </div>
            <TeamMembersList accessList={child.accessList} isParent={isParent} childId={id} />
          </div>

          {/* Quick Actions */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href={`/children/${id}/health`}
                className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
              >
                <span className="material-symbols-rounded text-coral-500 mr-3">
                  monitor_heart
                </span>
                <span className="text-sage-700 dark:text-sage-300">
                  Health Tracking
                </span>
              </Link>
              <Link
                href={`/messages/new?child=${id}`}
                className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
              >
                <span className="material-symbols-rounded text-primary-500 mr-3">
                  chat
                </span>
                <span className="text-sage-700 dark:text-sage-300">
                  Message Team
                </span>
              </Link>
              <Link
                href={`/video/schedule?child=${id}`}
                className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
              >
                <span className="material-symbols-rounded text-lavender-500 mr-3">
                  video_call
                </span>
                <span className="text-sage-700 dark:text-sage-300">
                  Schedule Visit
                </span>
              </Link>
              <Link
                href={`/garden/${id}`}
                className="flex items-center p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
              >
                <span className="material-symbols-rounded text-teal-500 mr-3">
                  psychiatry
                </span>
                <span className="text-sage-700 dark:text-sage-300">
                  View Garden
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
