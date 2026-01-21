import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Role } from "@prisma/client";
import { DeleteNoteButton } from "./delete-note-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NoteDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const userRole = session.user.role as Role;

  // Only professionals can view notes
  if (userRole !== Role.CLINICIAN && userRole !== Role.SUPPORT && userRole !== Role.ADMIN) {
    redirect("/dashboard");
  }

  // Try to find the note in either table
  let note: {
    id: string;
    childId: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
    child: { id: string; name: string };
    author: { id: string; name: string | null; role: Role };
    noteCategory: "medical" | "support";
    // Medical fields
    noteType?: string;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    medications?: string | null;
    vitals?: string | null;
    // Support fields
    sessionSummary?: string | null;
    goals?: string | null;
    interventions?: string | null;
    observations?: string | null;
    progress?: string | null;
    homePractice?: string | null;
  } | null = null;

  // First, check access
  const accessibleChildren = await prisma.childAccess.findMany({
    where: {
      professionalId: session.user.id,
      isActive: true,
    },
    select: { childId: true },
  });
  const childIds = accessibleChildren.map((a) => a.childId);

  // Try medical note first
  const medicalNote = await prisma.medicalNote.findUnique({
    where: { id },
    include: {
      child: { select: { id: true, name: true } },
      author: { select: { id: true, name: true, role: true } },
    },
  });

  if (medicalNote) {
    if (!childIds.includes(medicalNote.childId) && userRole !== Role.ADMIN) {
      notFound();
    }
    note = { ...medicalNote, noteCategory: "medical" };
  } else {
    // Try support note
    const supportNote = await prisma.supportNote.findUnique({
      where: { id },
      include: {
        child: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, role: true } },
      },
    });

    if (supportNote) {
      if (!childIds.includes(supportNote.childId) && userRole !== Role.ADMIN) {
        notFound();
      }
      note = { ...supportNote, noteCategory: "support" };
    }
  }

  if (!note) {
    notFound();
  }

  const isOwner = note.authorId === session.user.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/notes"
            className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
          >
            <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
              arrow_back
            </span>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
                {note.noteCategory === "medical" ? "Medical Note" : "Support Note"}
              </h1>
              <span
                className={`badge ${
                  note.noteCategory === "medical" ? "badge-lavender" : "badge-teal"
                }`}
              >
                {note.noteCategory === "medical" ? note.noteType : "Support"}
              </span>
            </div>
            <p className="text-sage-600 dark:text-sage-400">
              {note.child.name} •{" "}
              {new Date(note.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center space-x-2">
            <Link
              href={`/notes/${note.id}/edit`}
              className="btn-secondary"
            >
              <span className="material-symbols-rounded mr-2">edit</span>
              Edit
            </Link>
            <DeleteNoteButton
              noteId={note.id}
              noteCategory={note.noteCategory}
            />
          </div>
        )}
      </div>

      {/* Note Info Card */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                note.noteCategory === "medical"
                  ? "bg-lavender-100 dark:bg-lavender-900/30"
                  : "bg-teal-100 dark:bg-teal-900/30"
              }`}
            >
              <span
                className={`material-symbols-rounded text-2xl ${
                  note.noteCategory === "medical"
                    ? "text-lavender-600 dark:text-lavender-400"
                    : "text-teal-600 dark:text-teal-400"
                }`}
              >
                {note.noteCategory === "medical" ? "description" : "note"}
              </span>
            </div>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Documented by {note.author.name || "Unknown"}
              </p>
              <p className="text-sm text-sage-500 dark:text-sage-400">
                {note.author.role === Role.CLINICIAN
                  ? "Healthcare Clinician"
                  : note.author.role === Role.SUPPORT
                  ? "Support Professional"
                  : note.author.role}
              </p>
            </div>
          </div>
          {note.updatedAt > note.createdAt && (
            <p className="text-sm text-sage-500 dark:text-sage-400">
              Updated:{" "}
              {new Date(note.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>

      {/* Medical Note Content */}
      {note.noteCategory === "medical" && (
        <>
          {/* SOAP Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subjective */}
            <div className="card p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  S
                </span>
                <h3 className="font-semibold text-sage-900 dark:text-white">
                  Subjective
                </h3>
              </div>
              <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
                {note.subjective || (
                  <span className="text-sage-400 italic">Not documented</span>
                )}
              </p>
            </div>

            {/* Objective */}
            <div className="card p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-bold">
                  O
                </span>
                <h3 className="font-semibold text-sage-900 dark:text-white">
                  Objective
                </h3>
              </div>
              <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
                {note.objective || (
                  <span className="text-sage-400 italic">Not documented</span>
                )}
              </p>
            </div>

            {/* Assessment */}
            <div className="card p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-bold">
                  A
                </span>
                <h3 className="font-semibold text-sage-900 dark:text-white">
                  Assessment
                </h3>
              </div>
              <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
                {note.assessment || (
                  <span className="text-sage-400 italic">Not documented</span>
                )}
              </p>
            </div>

            {/* Plan */}
            <div className="card p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-bold">
                  P
                </span>
                <h3 className="font-semibold text-sage-900 dark:text-white">
                  Plan
                </h3>
              </div>
              <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
                {note.plan || (
                  <span className="text-sage-400 italic">Not documented</span>
                )}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {(note.vitals || note.medications) && (
            <div className="card p-4">
              <h3 className="font-semibold text-sage-900 dark:text-white mb-3">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {note.vitals && (
                  <div>
                    <p className="text-sm font-medium text-sage-500 dark:text-sage-400 mb-1">
                      Vitals
                    </p>
                    <p className="text-sage-700 dark:text-sage-300">
                      {note.vitals}
                    </p>
                  </div>
                )}
                {note.medications && (
                  <div>
                    <p className="text-sm font-medium text-sage-500 dark:text-sage-400 mb-1">
                      Medications
                    </p>
                    <p className="text-sage-700 dark:text-sage-300">
                      {note.medications}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Support Note Content */}
      {note.noteCategory === "support" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Session Summary */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-3 flex items-center">
              <span className="material-symbols-rounded mr-2 text-teal-500">
                summarize
              </span>
              Session Summary
            </h3>
            <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
              {note.sessionSummary || (
                <span className="text-sage-400 italic">Not documented</span>
              )}
            </p>
          </div>

          {/* Goals */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-3 flex items-center">
              <span className="material-symbols-rounded mr-2 text-teal-500">
                flag
              </span>
              Goals Addressed
            </h3>
            <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
              {note.goals || (
                <span className="text-sage-400 italic">Not documented</span>
              )}
            </p>
          </div>

          {/* Interventions */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-3 flex items-center">
              <span className="material-symbols-rounded mr-2 text-teal-500">
                build
              </span>
              Interventions
            </h3>
            <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
              {note.interventions || (
                <span className="text-sage-400 italic">Not documented</span>
              )}
            </p>
          </div>

          {/* Observations */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-3 flex items-center">
              <span className="material-symbols-rounded mr-2 text-teal-500">
                visibility
              </span>
              Observations
            </h3>
            <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
              {note.observations || (
                <span className="text-sage-400 italic">Not documented</span>
              )}
            </p>
          </div>

          {/* Progress */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-3 flex items-center">
              <span className="material-symbols-rounded mr-2 text-teal-500">
                trending_up
              </span>
              Progress
            </h3>
            <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
              {note.progress || (
                <span className="text-sage-400 italic">Not documented</span>
              )}
            </p>
          </div>

          {/* Home Practice */}
          <div className="card p-4">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-3 flex items-center">
              <span className="material-symbols-rounded mr-2 text-teal-500">
                home
              </span>
              Home Practice
            </h3>
            <p className="text-sage-700 dark:text-sage-300 whitespace-pre-wrap">
              {note.homePractice || (
                <span className="text-sage-400 italic">Not documented</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-4">
        <h3 className="font-semibold text-sage-900 dark:text-white mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/children/${note.childId}`}
            className="btn-secondary"
          >
            <span className="material-symbols-rounded mr-2">person</span>
            View Patient Profile
          </Link>
          <Link
            href={`/notes/new?child=${note.childId}`}
            className="btn-secondary"
          >
            <span className="material-symbols-rounded mr-2">note_add</span>
            New Note for {note.child.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
