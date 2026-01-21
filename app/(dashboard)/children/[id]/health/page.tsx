import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import HealthClient from "./health-client";

interface HealthPageProps {
  params: Promise<{ id: string }>;
}

export default async function HealthPage({ params }: HealthPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get child profile with symptoms and prescriptions
  const child = await prisma.childProfile.findUnique({
    where: { id },
    include: {
      symptomLogs: {
        orderBy: { occurredAt: "desc" },
        take: 20,
        include: {
          loggedBy: {
            select: { name: true },
          },
        },
      },
      prescriptions: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          addedBy: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!child) redirect("/children");

  // Only parent can access
  if (child.parentId !== session.user.id) redirect("/children");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/children/${id}`}
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Health Tracking
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            {child.preferredName || child.name}&apos;s symptoms and medications
          </p>
        </div>
      </div>

      <HealthClient
        childId={child.id}
        childName={child.preferredName || child.name}
        initialSymptoms={child.symptomLogs.map((log) => ({
          ...log,
          occurredAt: log.occurredAt.toISOString(),
          createdAt: log.createdAt.toISOString(),
          updatedAt: log.updatedAt.toISOString(),
        }))}
        initialPrescriptions={child.prescriptions.map((rx) => ({
          ...rx,
          startDate: rx.startDate?.toISOString() || null,
          endDate: rx.endDate?.toISOString() || null,
          refillDate: rx.refillDate?.toISOString() || null,
          createdAt: rx.createdAt.toISOString(),
          updatedAt: rx.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
