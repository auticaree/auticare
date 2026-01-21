"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Child {
  id: string;
  name: string;
}

type NoteType = "anamnesis" | "visit" | "care_plan" | "medication";

interface MedicalFormData {
  childId: string;
  noteType: NoteType;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  medications: string;
  vitals: string;
}

interface SupportFormData {
  childId: string;
  sessionSummary: string;
  goals: string;
  interventions: string;
  observations: string;
  progress: string;
  homePractice: string;
}

function NewNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedChild = searchParams.get("child");

  const [noteCategory, setNoteCategory] = useState<"medical" | "support">("medical");
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  const [medicalData, setMedicalData] = useState<MedicalFormData>({
    childId: preselectedChild || "",
    noteType: "visit",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    medications: "",
    vitals: "",
  });

  const [supportData, setSupportData] = useState<SupportFormData>({
    childId: preselectedChild || "",
    sessionSummary: "",
    goals: "",
    interventions: "",
    observations: "",
    progress: "",
    homePractice: "",
  });

  useEffect(() => {
    async function fetchChildren() {
      try {
        const response = await fetch("/api/children");
        const data = await response.json();
        if (response.ok) {
          setChildren(data.children);
          if (preselectedChild && data.children.some((c: Child) => c.id === preselectedChild)) {
            setMedicalData((prev) => ({ ...prev, childId: preselectedChild }));
            setSupportData((prev) => ({ ...prev, childId: preselectedChild }));
          } else if (data.children.length === 1) {
            setMedicalData((prev) => ({ ...prev, childId: data.children[0].id }));
            setSupportData((prev) => ({ ...prev, childId: data.children[0].id }));
          }
        }
      } catch {
        console.error("Error fetching children");
      } finally {
        setIsFetching(false);
      }
    }
    fetchChildren();
  }, [preselectedChild]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const endpoint = noteCategory === "medical" ? "/api/notes/medical" : "/api/notes/support";
    const data = noteCategory === "medical" ? medicalData : supportData;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create note");
        return;
      }

      router.push(`/notes/${result.note.id}`);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const noteTypes: { value: NoteType; label: string; icon: string }[] = [
    { value: "visit", label: "Visit Note", icon: "event" },
    { value: "anamnesis", label: "Anamnesis", icon: "history" },
    { value: "care_plan", label: "Care Plan", icon: "assignment" },
    { value: "medication", label: "Medication", icon: "medication" },
  ];

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <span className="material-symbols-rounded animate-spin text-3xl text-primary-500">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            New Clinical Note
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Document patient encounter using SOAP format
          </p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="material-symbols-rounded text-4xl text-sage-400 mb-4">
            group_off
          </span>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            No patients available
          </h3>
          <p className="text-sage-600 dark:text-sage-400">
            You need patient access to create notes. Wait for families to invite you.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300">
              <span className="material-symbols-rounded mr-2 align-middle">error</span>
              {error}
            </div>
          )}

          {/* Note Category Toggle */}
          <div className="card p-4">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
              Note Category
            </label>
            <div className="flex rounded-xl bg-sage-100 dark:bg-sage-800 p-1">
              <button
                type="button"
                onClick={() => setNoteCategory("medical")}
                className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${noteCategory === "medical"
                    ? "bg-white dark:bg-sage-700 text-sage-900 dark:text-white shadow-sm"
                    : "text-sage-600 dark:text-sage-400"
                  }`}
              >
                <span className="material-symbols-rounded mr-2 text-sm">medical_services</span>
                Medical Note
              </button>
              <button
                type="button"
                onClick={() => setNoteCategory("support")}
                className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${noteCategory === "support"
                    ? "bg-white dark:bg-sage-700 text-sage-900 dark:text-white shadow-sm"
                    : "text-sage-600 dark:text-sage-400"
                  }`}
              >
                <span className="material-symbols-rounded mr-2 text-sm">support_agent</span>
                Support Note
              </button>
            </div>
          </div>

          {/* Patient Selection */}
          <div className="card p-4">
            <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
              Patient
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {children.map((child) => (
                <label
                  key={child.id}
                  className={`flex items-center p-3 rounded-xl cursor-pointer transition-all ${(noteCategory === "medical" ? medicalData.childId : supportData.childId) === child.id
                      ? "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500"
                      : "bg-sage-50 dark:bg-sage-800 border-2 border-transparent hover:border-sage-200 dark:hover:border-sage-700"
                    }`}
                >
                  <input
                    type="radio"
                    name="childId"
                    value={child.id}
                    checked={(noteCategory === "medical" ? medicalData.childId : supportData.childId) === child.id}
                    onChange={(e) => {
                      if (noteCategory === "medical") {
                        setMedicalData((prev) => ({ ...prev, childId: e.target.value }));
                      } else {
                        setSupportData((prev) => ({ ...prev, childId: e.target.value }));
                      }
                    }}
                    className="sr-only"
                    required
                  />
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-medium mr-3">
                    {child.name.charAt(0)}
                  </div>
                  <span className="font-medium text-sage-900 dark:text-white">
                    {child.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Medical Note Form */}
          {noteCategory === "medical" && (
            <>
              {/* Note Type */}
              <div className="card p-4">
                <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
                  Note Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {noteTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all ${medicalData.noteType === type.value
                          ? "bg-lavender-50 dark:bg-lavender-900/20 border-2 border-lavender-500"
                          : "bg-sage-50 dark:bg-sage-800 border-2 border-transparent hover:border-sage-200"
                        }`}
                    >
                      <input
                        type="radio"
                        name="noteType"
                        value={type.value}
                        checked={medicalData.noteType === type.value}
                        onChange={(e) =>
                          setMedicalData((prev) => ({
                            ...prev,
                            noteType: e.target.value as NoteType,
                          }))
                        }
                        className="sr-only"
                      />
                      <span
                        className={`material-symbols-rounded text-2xl mb-1 ${medicalData.noteType === type.value
                            ? "text-lavender-600 dark:text-lavender-400"
                            : "text-sage-400"
                          }`}
                      >
                        {type.icon}
                      </span>
                      <span
                        className={`text-sm font-medium ${medicalData.noteType === type.value
                            ? "text-lavender-700 dark:text-lavender-300"
                            : "text-sage-600 dark:text-sage-400"
                          }`}
                      >
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* SOAP Fields */}
              <div className="card p-4 space-y-4">
                <h3 className="font-semibold text-sage-900 dark:text-white flex items-center">
                  <span className="material-symbols-rounded mr-2 text-lavender-500">description</span>
                  SOAP Documentation
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Subjective */}
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mr-2">
                        S
                      </span>
                      Subjective
                    </label>
                    <textarea
                      value={medicalData.subjective}
                      onChange={(e) =>
                        setMedicalData((prev) => ({ ...prev, subjective: e.target.value }))
                      }
                      className="input-field min-h-30 resize-none"
                      placeholder="Patient's symptoms, concerns, and history as reported..."
                    />
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold mr-2">
                        O
                      </span>
                      Objective
                    </label>
                    <textarea
                      value={medicalData.objective}
                      onChange={(e) =>
                        setMedicalData((prev) => ({ ...prev, objective: e.target.value }))
                      }
                      className="input-field min-h-30 resize-none"
                      placeholder="Clinical observations, exam findings, test results..."
                    />
                  </div>

                  {/* Assessment */}
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-bold mr-2">
                        A
                      </span>
                      Assessment
                    </label>
                    <textarea
                      value={medicalData.assessment}
                      onChange={(e) =>
                        setMedicalData((prev) => ({ ...prev, assessment: e.target.value }))
                      }
                      className="input-field min-h-30 resize-none"
                      placeholder="Diagnosis, clinical impressions, differential diagnoses..."
                    />
                  </div>

                  {/* Plan */}
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold mr-2">
                        P
                      </span>
                      Plan
                    </label>
                    <textarea
                      value={medicalData.plan}
                      onChange={(e) =>
                        setMedicalData((prev) => ({ ...prev, plan: e.target.value }))
                      }
                      className="input-field min-h-30 resize-none"
                      placeholder="Treatment plan, medications, follow-up, referrals..."
                    />
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-sage-100 dark:border-sage-800">
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                      Vitals
                    </label>
                    <input
                      type="text"
                      value={medicalData.vitals}
                      onChange={(e) =>
                        setMedicalData((prev) => ({ ...prev, vitals: e.target.value }))
                      }
                      className="input-field"
                      placeholder="BP, HR, Temp, Weight, Height..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                      Medications
                    </label>
                    <input
                      type="text"
                      value={medicalData.medications}
                      onChange={(e) =>
                        setMedicalData((prev) => ({ ...prev, medications: e.target.value }))
                      }
                      className="input-field"
                      placeholder="Current medications, changes..."
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Support Note Form */}
          {noteCategory === "support" && (
            <div className="card p-4 space-y-4">
              <h3 className="font-semibold text-sage-900 dark:text-white flex items-center">
                <span className="material-symbols-rounded mr-2 text-teal-500">support_agent</span>
                Session Documentation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                    Session Summary
                  </label>
                  <textarea
                    value={supportData.sessionSummary}
                    onChange={(e) =>
                      setSupportData((prev) => ({ ...prev, sessionSummary: e.target.value }))
                    }
                    className="input-field min-h-30 resize-none"
                    placeholder="Overview of the session activities and focus areas..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                    Goals Addressed
                  </label>
                  <textarea
                    value={supportData.goals}
                    onChange={(e) =>
                      setSupportData((prev) => ({ ...prev, goals: e.target.value }))
                    }
                    className="input-field min-h-30ze-none"
                    placeholder="Treatment goals worked on during this session..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                    Interventions Used
                  </label>
                  <textarea
                    value={supportData.interventions}
                    onChange={(e) =>
                      setSupportData((prev) => ({ ...prev, interventions: e.target.value }))
                    }
                    className="input-field min-h-30 resize-none"
                    placeholder="Therapeutic techniques and strategies applied..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                    Observations
                  </label>
                  <textarea
                    value={supportData.observations}
                    onChange={(e) =>
                      setSupportData((prev) => ({ ...prev, observations: e.target.value }))
                    }
                    className="input-field min-h-30 resize-none"
                    placeholder="Behavioral observations and responses..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                    Progress Notes
                  </label>
                  <textarea
                    value={supportData.progress}
                    onChange={(e) =>
                      setSupportData((prev) => ({ ...prev, progress: e.target.value }))
                    }
                    className="input-field min-h-30 resize-none"
                    placeholder="Progress toward goals, improvements, challenges..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-1">
                    Home Practice
                  </label>
                  <textarea
                    value={supportData.homePractice}
                    onChange={(e) =>
                      setSupportData((prev) => ({ ...prev, homePractice: e.target.value }))
                    }
                    className="input-field min-h-30 resize-none"
                    placeholder="Homework, activities for home practice..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3">
            <Link href="/notes" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !(noteCategory === "medical" ? medicalData.childId : supportData.childId)}
              className="btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-rounded animate-spin mr-2">
                    progress_activity
                  </span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded mr-2">save</span>
                  Save Note
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function NewNotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-100">
          <span className="material-symbols-rounded animate-spin text-3xl text-primary-500">
            progress_activity
          </span>
        </div>
      }
    >
      <NewNoteContent />
    </Suspense>
  );
}
