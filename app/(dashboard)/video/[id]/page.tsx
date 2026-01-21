import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import VideoRoomClient from "./video-room-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

const DEFAULT_DURATION_MINUTES = 30;

export default async function VideoRoomPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userRole = session.user.role as Role;

  const visit = await prisma.videoVisit.findUnique({
    where: { id },
    include: {
      child: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!visit) notFound();

  // Verify access
  const isParent = userRole === Role.PARENT && visit.child.parentId === session.user.id;
  const isProfessional = visit.hostId === session.user.id;
  const isAdmin = userRole === Role.ADMIN;

  if (!isParent && !isProfessional && !isAdmin) {
    redirect("/video");
  }

  // Check if visit is in valid time window
  const now = new Date();
  const visitStart = visit.scheduledAt ? new Date(visit.scheduledAt) : new Date();
  const visitEnd = new Date(visitStart.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  const earlyJoinWindow = 10 * 60 * 1000; // 10 minutes early

  const canJoin = now.getTime() >= visitStart.getTime() - earlyJoinWindow && now <= visitEnd;
  const isUpcoming = now < visitStart;
  const isPast = now > visitEnd;

  // If can't join yet or already past, show info page instead
  if (!canJoin || visit.status === "CANCELLED") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="card p-8 text-center">
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
              visit.status === "CANCELLED"
                ? "bg-coral-100 dark:bg-coral-900/30"
                : isPast
                ? "bg-sage-100 dark:bg-sage-800"
                : "bg-primary-100 dark:bg-primary-900/30"
            }`}
          >
            <span
              className={`material-symbols-rounded text-4xl ${
                visit.status === "CANCELLED"
                  ? "text-coral-500"
                  : isPast
                  ? "text-sage-500"
                  : "text-primary-500"
              }`}
            >
              {visit.status === "CANCELLED"
                ? "cancel"
                : isPast
                ? "event_available"
                : "schedule"}
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white mb-2">
            {visit.status === "CANCELLED"
              ? "Appointment Cancelled"
              : isPast
              ? "Appointment Completed"
              : "Upcoming Appointment"}
          </h1>

          <p className="text-sage-600 dark:text-sage-400 mb-6">
            {visit.status === "CANCELLED"
              ? "This video consultation has been cancelled."
              : isPast
              ? "This video consultation has ended."
              : `Your appointment is scheduled for ${visitStart.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })} at ${visitStart.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}`}
          </p>

          {isUpcoming && (
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6">
              <p className="text-primary-700 dark:text-primary-300 text-sm">
                You can join the video call up to 10 minutes before the scheduled time.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-sage-50 dark:bg-sage-800/50 rounded-xl">
              <span className="text-sage-600 dark:text-sage-400">Patient</span>
              <span className="font-medium text-sage-900 dark:text-white">
                {visit.child.name}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-sage-50 dark:bg-sage-800/50 rounded-xl">
              <span className="text-sage-600 dark:text-sage-400">Provider</span>
              <span className="font-medium text-sage-900 dark:text-white">
                {visit.host.name}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-sage-50 dark:bg-sage-800/50 rounded-xl">
              <span className="text-sage-600 dark:text-sage-400">Duration</span>
              <span className="font-medium text-sage-900 dark:text-white">
                {DEFAULT_DURATION_MINUTES} minutes
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Update visit status to in_progress if scheduled
  if (visit.status === "SCHEDULED") {
    await prisma.videoVisit.update({
      where: { id },
      data: { status: "IN_PROGRESS" },
    });
  }

  return (
    <VideoRoomClient
      visit={{
        id: visit.id,
        roomName: visit.roomName || "Consultation Room",
        duration: DEFAULT_DURATION_MINUTES,
        professionalName: visit.host.name || "Provider",
        childName: visit.child.name,
      }}
      isParent={isParent}
      userName={session.user.name || "User"}
    />
  );
}
