import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = session.user.role as Role;

  // Only professionals can access this page
  if (userRole !== Role.CLINICIAN && userRole !== Role.SUPPORT && userRole !== Role.ADMIN) {
    redirect("/dashboard");
  }

  // Get patients this professional has access to
  const accessList = await prisma.childAccess.findMany({
    where: {
      professionalId: session.user.id,
      isActive: true,
    },
    include: {
      child: {
        include: {
          parent: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: {
              medicalNotes: true,
              supportNotes: true,
              videoVisits: true,
            },
          },
        },
      },
    },
    orderBy: {
      grantedAt: "desc",
    },
  });

  const patients = accessList.map((access) => ({
    ...access.child,
    scopes: access.scopes,
    accessGrantedAt: access.grantedAt,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            My Patients
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mt-1">
            Children you have been granted access to
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="material-symbols-rounded text-primary-600 dark:text-primary-400">
                group
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-900 dark:text-white">
                {patients.length}
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Active Patients
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center">
              <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400">
                description
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-900 dark:text-white">
                {patients.reduce((acc, p) => acc + p._count.medicalNotes, 0)}
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Medical Notes
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <span className="material-symbols-rounded text-teal-600 dark:text-teal-400">
                videocam
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-sage-900 dark:text-white">
                {patients.reduce((acc, p) => acc + p._count.videoVisits, 0)}
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Video Visits
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      {patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const age = Math.floor(
              (Date.now() - new Date(patient.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            );

            return (
              <Link
                key={patient.id}
                href={`/children/${patient.id}`}
                className="card p-4 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-semibold text-xl shadow-glow shrink-0">
                    {patient.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sage-900 dark:text-white truncate">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-sage-600 dark:text-sage-400">
                      {age} years old
                    </p>
                    <p className="text-xs text-sage-500 dark:text-sage-500 mt-1">
                      Parent: {patient.parent.name}
                    </p>
                  </div>
                </div>

                {/* Permissions badges */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {patient.scopes.includes("VIDEO_VISITS") && (
                    <span className="badge badge-teal text-xs">Video</span>
                  )}
                  {patient.scopes.includes("MEDICAL_NOTES") && (
                    <span className="badge badge-lavender text-xs">Medical</span>
                  )}
                  {patient.scopes.includes("SUPPORT_NOTES") && (
                    <span className="badge badge-primary text-xs">Support</span>
                  )}
                  {patient.scopes.includes("MESSAGES") && (
                    <span className="badge badge-sage text-xs">Messages</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-sage-100 dark:border-sage-800">
                  <div className="flex items-center space-x-4 text-xs text-sage-500 dark:text-sage-400">
                    <span className="flex items-center">
                      <span className="material-symbols-rounded text-sm mr-1">
                        description
                      </span>
                      {patient._count.medicalNotes} notes
                    </span>
                    <span className="flex items-center">
                      <span className="material-symbols-rounded text-sm mr-1">
                        videocam
                      </span>
                      {patient._count.videoVisits} visits
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-sage-100 dark:bg-sage-800 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-3xl text-sage-400">
              person_off
            </span>
          </div>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            No patients yet
          </h3>
          <p className="text-sage-600 dark:text-sage-400 max-w-md mx-auto">
            You haven&apos;t been granted access to any patients yet. Parents can invite you 
            to their child&apos;s care team from their child&apos;s profile.
          </p>
        </div>
      )}
    </div>
  );
}
