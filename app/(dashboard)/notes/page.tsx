import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ child?: string; type?: string }>;
}

export default async function NotesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { child: childFilter, type: typeFilter } = await searchParams;
  const userRole = session.user.role as Role;

  // Only professionals can view notes
  if (userRole !== Role.CLINICIAN && userRole !== Role.SUPPORT && userRole !== Role.ADMIN) {
    redirect("/dashboard");
  }

  // Get accessible children
  const accessibleChildren = await prisma.childAccess.findMany({
    where: {
      professionalId: session.user.id,
      isActive: true,
    },
    select: {
      childId: true,
      child: {
        select: { id: true, name: true },
      },
    },
  });

  const childIds = accessibleChildren.map((a) => a.childId);

  // Fetch notes based on role and filters
  const whereClause = {
    childId: childFilter && childIds.includes(childFilter) ? childFilter : { in: childIds },
  };

  const [medicalNotes, supportNotes] = await Promise.all([
    userRole === Role.CLINICIAN || typeFilter !== "support"
      ? prisma.medicalNote.findMany({
        where: whereClause,
        include: {
          child: { select: { id: true, name: true } },
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      : [],
    userRole === Role.SUPPORT || userRole === Role.CLINICIAN || typeFilter !== "medical"
      ? prisma.supportNote.findMany({
        where: whereClause,
        include: {
          child: { select: { id: true, name: true } },
          author: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
      : [],
  ]);

  // Combine and sort notes
  const allNotes = [
    ...medicalNotes.map((note) => ({ ...note, noteCategory: "medical" as const })),
    ...supportNotes.map((note) => ({ ...note, noteCategory: "support" as const })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Clinical Notes
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            SOAP documentation for patient care
          </p>
        </div>
        <Link href="/notes/new" className="btn-primary">
          <span className="material-symbols-rounded mr-2">note_add</span>
          New Note
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Child Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-sage-700 dark:text-sage-300">
              Patient:
            </label>
            <div className="relative">
              <select
                defaultValue={childFilter || "all"}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  if (e.target.value === "all") {
                    url.searchParams.delete("child");
                  } else {
                    url.searchParams.set("child", e.target.value);
                  }
                  window.location.href = url.toString();
                }}
                className="input-field py-2 pr-8 appearance-none"
              >
                <option value="all">All Patients</option>
                {accessibleChildren.map((access) => (
                  <option key={access.childId} value={access.childId}>
                    {access.child.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-rounded text-sage-400 pointer-events-none text-sm">
                expand_more
              </span>
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-sage-700 dark:text-sage-300">
              Type:
            </label>
            <div className="flex rounded-xl bg-sage-100 dark:bg-sage-800 p-1">
              <Link
                href={`/notes${childFilter ? `?child=${childFilter}` : ""}`}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!typeFilter
                  ? "bg-white dark:bg-sage-700 text-sage-900 dark:text-white shadow-sm"
                  : "text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white"
                  }`}
              >
                All
              </Link>
              <Link
                href={`/notes?type=medical${childFilter ? `&child=${childFilter}` : ""}`}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === "medical"
                  ? "bg-white dark:bg-sage-700 text-sage-900 dark:text-white shadow-sm"
                  : "text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white"
                  }`}
              >
                Medical
              </Link>
              <Link
                href={`/notes?type=support${childFilter ? `&child=${childFilter}` : ""}`}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${typeFilter === "support"
                  ? "bg-white dark:bg-sage-700 text-sage-900 dark:text-white shadow-sm"
                  : "text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white"
                  }`}
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      {allNotes.length > 0 ? (
        <div className="space-y-4">
          {allNotes.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className="card p-4 block hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${note.noteCategory === "medical"
                      ? "bg-lavender-100 dark:bg-lavender-900/30"
                      : "bg-teal-100 dark:bg-teal-900/30"
                      }`}
                  >
                    <span
                      className={`material-symbols-rounded ${note.noteCategory === "medical"
                        ? "text-lavender-600 dark:text-lavender-400"
                        : "text-teal-600 dark:text-teal-400"
                        }`}
                    >
                      {note.noteCategory === "medical" ? "description" : "note"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sage-900 dark:text-white">
                        {note.child.name}
                      </span>
                      <span
                        className={`badge ${note.noteCategory === "medical"
                          ? "badge-lavender"
                          : "badge-teal"
                          }`}
                      >
                        {note.noteCategory === "medical"
                          ? (note as typeof medicalNotes[0]).noteType
                          : "Support"}
                      </span>
                    </div>
                    <p className="text-sm text-sage-500 dark:text-sage-400">
                      By {note.author.name} •{" "}
                      {new Date(note.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-rounded text-sage-400">
                  chevron_right
                </span>
              </div>

              {/* SOAP Preview */}
              {note.noteCategory === "medical" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Subjective", value: (note as typeof medicalNotes[0]).subjective },
                    { label: "Objective", value: (note as typeof medicalNotes[0]).objective },
                    { label: "Assessment", value: (note as typeof medicalNotes[0]).assessment },
                    { label: "Plan", value: (note as typeof medicalNotes[0]).plan },
                  ].map((section) => (
                    <div
                      key={section.label}
                      className="p-2 rounded-lg bg-sage-50 dark:bg-sage-800/50"
                    >
                      <p className="text-xs font-medium text-sage-500 dark:text-sage-400 mb-1">
                        {section.label}
                      </p>
                      <p className="text-sm text-sage-700 dark:text-sage-300 line-clamp-2">
                        {section.value || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {note.noteCategory === "support" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Session", value: (note as typeof supportNotes[0]).sessionSummary },
                    { label: "Goals", value: (note as typeof supportNotes[0]).goals },
                    { label: "Progress", value: (note as typeof supportNotes[0]).progress },
                  ].map((section) => (
                    <div
                      key={section.label}
                      className="p-2 rounded-lg bg-sage-50 dark:bg-sage-800/50"
                    >
                      <p className="text-xs font-medium text-sage-500 dark:text-sage-400 mb-1">
                        {section.label}
                      </p>
                      <p className="text-sm text-sage-700 dark:text-sage-300 line-clamp-2">
                        {section.value || "-"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-sage-100 dark:bg-sage-800 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-4xl text-sage-400">
              description
            </span>
          </div>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            No notes yet
          </h3>
          <p className="text-sage-600 dark:text-sage-400 mb-6 max-w-md mx-auto">
            {childIds.length === 0
              ? "You don't have access to any patients yet. Wait for families to invite you."
              : "Start documenting patient encounters with SOAP notes."}
          </p>
          {childIds.length > 0 && (
            <Link href="/notes/new" className="btn-primary inline-flex">
              <span className="material-symbols-rounded mr-2">note_add</span>
              Create First Note
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
