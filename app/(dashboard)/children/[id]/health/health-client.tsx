"use client";

import { useState } from "react";

interface SymptomLog {
  id: string;
  symptomType: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  notes: string | null;
  triggers: string[];
  duration: number | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  loggedBy: { name: string };
}

interface Prescription {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  prescribedBy: string | null;
  pharmacy: string | null;
  status: "ACTIVE" | "PAUSED" | "DISCONTINUED" | "COMPLETED";
  startDate: string | null;
  endDate: string | null;
  refillDate: string | null;
  sideEffectsNoted: string | null;
  createdAt: string;
  updatedAt: string;
  addedBy: { name: string };
}

interface HealthClientProps {
  childId: string;
  childName: string;
  initialSymptoms: SymptomLog[];
  initialPrescriptions: Prescription[];
}

const symptomTypes = [
  { value: "meltdown", label: "Meltdown", icon: "mood_bad" },
  { value: "sleep_issue", label: "Sleep Issue", icon: "bedtime" },
  { value: "digestive", label: "Digestive", icon: "gastroenterology" },
  { value: "sensory", label: "Sensory Overload", icon: "hearing" },
  { value: "anxiety", label: "Anxiety", icon: "psychology" },
  { value: "aggression", label: "Aggression", icon: "warning" },
  { value: "self_harm", label: "Self-Harm", icon: "emergency" },
  { value: "seizure", label: "Seizure", icon: "monitor_heart" },
  { value: "allergy", label: "Allergic Reaction", icon: "coronavirus" },
  { value: "pain", label: "Pain/Discomfort", icon: "healing" },
  { value: "other", label: "Other", icon: "more_horiz" },
];

const commonTriggers = [
  "Loud noises",
  "Bright lights",
  "Crowds",
  "Change in routine",
  "Transitions",
  "Hunger",
  "Fatigue",
  "Illness",
  "Sensory texture",
  "Social situation",
];

export default function HealthClient({
  childId,
  childName,
  initialSymptoms,
  initialPrescriptions,
}: HealthClientProps) {
  const [activeTab, setActiveTab] = useState<"symptoms" | "prescriptions">("symptoms");
  const [symptoms, setSymptoms] = useState<SymptomLog[]>(initialSymptoms);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Symptom form state
  const [symptomType, setSymptomType] = useState("");
  const [severity, setSeverity] = useState<"MILD" | "MODERATE" | "SEVERE">("MILD");
  const [symptomNotes, setSymptomNotes] = useState("");
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));

  // Prescription form state
  const [rxName, setRxName] = useState("");
  const [rxDosage, setRxDosage] = useState("");
  const [rxFrequency, setRxFrequency] = useState("");
  const [rxInstructions, setRxInstructions] = useState("");
  const [rxPrescribedBy, setRxPrescribedBy] = useState("");
  const [rxPharmacy, setRxPharmacy] = useState("");

  const handleAddSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomType) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/children/${childId}/symptoms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptomType,
          severity,
          notes: symptomNotes || undefined,
          triggers: selectedTriggers,
          duration: duration ? parseInt(duration) : undefined,
          occurredAt: new Date(occurredAt).toISOString(),
        }),
      });

      if (response.ok) {
        const newSymptom = await response.json();
        setSymptoms([newSymptom, ...symptoms]);
        resetSymptomForm();
        setShowSymptomForm(false);
      }
    } catch (error) {
      console.error("Error adding symptom:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxName || !rxDosage || !rxFrequency) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/children/${childId}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rxName,
          dosage: rxDosage,
          frequency: rxFrequency,
          instructions: rxInstructions || undefined,
          prescribedBy: rxPrescribedBy || undefined,
          pharmacy: rxPharmacy || undefined,
        }),
      });

      if (response.ok) {
        const newRx = await response.json();
        setPrescriptions([newRx, ...prescriptions]);
        resetPrescriptionForm();
        setShowPrescriptionForm(false);
      }
    } catch (error) {
      console.error("Error adding prescription:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSymptomForm = () => {
    setSymptomType("");
    setSeverity("MILD");
    setSymptomNotes("");
    setSelectedTriggers([]);
    setDuration("");
    setOccurredAt(new Date().toISOString().slice(0, 16));
  };

  const resetPrescriptionForm = () => {
    setRxName("");
    setRxDosage("");
    setRxFrequency("");
    setRxInstructions("");
    setRxPrescribedBy("");
    setRxPharmacy("");
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "MILD":
        return "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400";
      case "MODERATE":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "SEVERE":
        return "bg-coral-100 text-coral-700 dark:bg-coral-900/30 dark:text-coral-400";
      default:
        return "bg-sage-100 text-sage-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400";
      case "PAUSED":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "DISCONTINUED":
        return "bg-coral-100 text-coral-700 dark:bg-coral-900/30 dark:text-coral-400";
      case "COMPLETED":
        return "bg-sage-100 text-sage-700 dark:bg-sage-800 dark:text-sage-400";
      default:
        return "bg-sage-100 text-sage-700";
    }
  };

  const activePrescriptions = prescriptions.filter((rx) => rx.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-sage-900 dark:text-white">
            {symptoms.length}
          </p>
          <p className="text-sm text-sage-600 dark:text-sage-400">
            Symptoms Logged
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-sage-900 dark:text-white">
            {activePrescriptions.length}
          </p>
          <p className="text-sm text-sage-600 dark:text-sage-400">
            Active Medications
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-coral-600 dark:text-coral-400">
            {symptoms.filter((s) => s.severity === "SEVERE").length}
          </p>
          <p className="text-sm text-sage-600 dark:text-sage-400">
            Severe Episodes
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {prescriptions.filter((rx) => rx.refillDate && new Date(rx.refillDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
          </p>
          <p className="text-sm text-sage-600 dark:text-sage-400">
            Refills Due Soon
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sage-200 dark:border-sage-700">
        <button
          onClick={() => setActiveTab("symptoms")}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === "symptoms"
              ? "text-primary-600 dark:text-primary-400"
              : "text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-rounded text-xl">monitor_heart</span>
            Symptom Log
          </span>
          {activeTab === "symptoms" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("prescriptions")}
          className={`px-4 py-3 font-medium transition-colors relative ${
            activeTab === "prescriptions"
              ? "text-primary-600 dark:text-primary-400"
              : "text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-rounded text-xl">medication</span>
            Prescriptions
          </span>
          {activeTab === "prescriptions" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
          )}
        </button>
      </div>

      {/* Symptoms Tab */}
      {activeTab === "symptoms" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-sage-900 dark:text-white">
              Recent Symptoms
            </h2>
            <button
              onClick={() => setShowSymptomForm(true)}
              className="btn-primary"
            >
              <span className="material-symbols-rounded mr-2">add</span>
              Log Symptom
            </button>
          </div>

          {/* Symptom Form Modal */}
          {showSymptomForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-sage-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-sage-900 dark:text-white">
                      Log a Symptom
                    </h3>
                    <button
                      onClick={() => {
                        setShowSymptomForm(false);
                        resetSymptomForm();
                      }}
                      className="p-2 hover:bg-sage-100 dark:hover:bg-sage-700 rounded-lg"
                    >
                      <span className="material-symbols-rounded">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleAddSymptom} className="space-y-4">
                    {/* Symptom Type */}
                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        Type of Symptom
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {symptomTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setSymptomType(type.value)}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                              symptomType === type.value
                                ? "bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500"
                                : "bg-sage-50 dark:bg-sage-700 hover:bg-sage-100 dark:hover:bg-sage-600"
                            }`}
                          >
                            <span className="material-symbols-rounded text-xl">
                              {type.icon}
                            </span>
                            <span className="text-xs font-medium">{type.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Severity */}
                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        Severity
                      </label>
                      <div className="flex gap-2">
                        {(["MILD", "MODERATE", "SEVERE"] as const).map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setSeverity(sev)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                              severity === sev
                                ? getSeverityColor(sev) + " ring-2 ring-offset-2"
                                : "bg-sage-100 dark:bg-sage-700"
                            }`}
                          >
                            {sev.charAt(0) + sev.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* When */}
                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        When did it occur?
                      </label>
                      <input
                        type="datetime-local"
                        value={occurredAt}
                        onChange={(e) => setOccurredAt(e.target.value)}
                        className="input"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g., 15"
                        className="input"
                      />
                    </div>

                    {/* Triggers */}
                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        Potential Triggers
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {commonTriggers.map((trigger) => (
                          <button
                            key={trigger}
                            type="button"
                            onClick={() => {
                              setSelectedTriggers((prev) =>
                                prev.includes(trigger)
                                  ? prev.filter((t) => t !== trigger)
                                  : [...prev, trigger]
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-sm transition-all ${
                              selectedTriggers.includes(trigger)
                                ? "bg-primary-500 text-white"
                                : "bg-sage-100 dark:bg-sage-700 hover:bg-sage-200 dark:hover:bg-sage-600"
                            }`}
                          >
                            {trigger}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={symptomNotes}
                        onChange={(e) => setSymptomNotes(e.target.value)}
                        rows={3}
                        placeholder="Additional observations..."
                        className="input"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSymptomForm(false);
                          resetSymptomForm();
                        }}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!symptomType || isSubmitting}
                        className="btn-primary flex-1"
                      >
                        {isSubmitting ? "Saving..." : "Save Symptom"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Symptom List */}
          {symptoms.length > 0 ? (
            <div className="space-y-3">
              {symptoms.map((symptom) => {
                const typeInfo = symptomTypes.find((t) => t.value === symptom.symptomType);
                return (
                  <div
                    key={symptom.id}
                    className="card p-4 flex items-start gap-4"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSeverityColor(symptom.severity)}`}>
                      <span className="material-symbols-rounded text-2xl">
                        {typeInfo?.icon || "help"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sage-900 dark:text-white">
                            {typeInfo?.label || symptom.symptomType}
                          </h4>
                          <p className="text-sm text-sage-500">
                            {new Date(symptom.occurredAt).toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(symptom.severity)}`}>
                          {symptom.severity}
                        </span>
                      </div>
                      {symptom.duration && (
                        <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">
                          Duration: {symptom.duration} minutes
                        </p>
                      )}
                      {symptom.triggers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {symptom.triggers.map((trigger, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-sage-100 dark:bg-sage-700 rounded text-xs"
                            >
                              {trigger}
                            </span>
                          ))}
                        </div>
                      )}
                      {symptom.notes && (
                        <p className="text-sm text-sage-600 dark:text-sage-400 mt-2">
                          {symptom.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <span className="material-symbols-rounded text-4xl text-sage-400 mb-4">
                monitor_heart
              </span>
              <h3 className="font-semibold text-sage-900 dark:text-white mb-2">
                No symptoms logged yet
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                Track symptoms to identify patterns and share with care providers
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-sage-900 dark:text-white">
              Medications
            </h2>
            <button
              onClick={() => setShowPrescriptionForm(true)}
              className="btn-primary"
            >
              <span className="material-symbols-rounded mr-2">add</span>
              Add Medication
            </button>
          </div>

          {/* Prescription Form Modal */}
          {showPrescriptionForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-sage-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-sage-900 dark:text-white">
                      Add Medication
                    </h3>
                    <button
                      onClick={() => {
                        setShowPrescriptionForm(false);
                        resetPrescriptionForm();
                      }}
                      className="p-2 hover:bg-sage-100 dark:hover:bg-sage-700 rounded-lg"
                    >
                      <span className="material-symbols-rounded">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleAddPrescription} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        Medication Name *
                      </label>
                      <input
                        type="text"
                        value={rxName}
                        onChange={(e) => setRxName(e.target.value)}
                        placeholder="e.g., Risperidone"
                        className="input"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                          Dosage *
                        </label>
                        <input
                          type="text"
                          value={rxDosage}
                          onChange={(e) => setRxDosage(e.target.value)}
                          placeholder="e.g., 0.5mg"
                          className="input"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                          Frequency *
                        </label>
                        <input
                          type="text"
                          value={rxFrequency}
                          onChange={(e) => setRxFrequency(e.target.value)}
                          placeholder="e.g., Once daily at bedtime"
                          className="input"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                        Special Instructions
                      </label>
                      <textarea
                        value={rxInstructions}
                        onChange={(e) => setRxInstructions(e.target.value)}
                        placeholder="e.g., Take with food"
                        rows={2}
                        className="input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                          Prescribed By
                        </label>
                        <input
                          type="text"
                          value={rxPrescribedBy}
                          onChange={(e) => setRxPrescribedBy(e.target.value)}
                          placeholder="Doctor's name"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
                          Pharmacy
                        </label>
                        <input
                          type="text"
                          value={rxPharmacy}
                          onChange={(e) => setRxPharmacy(e.target.value)}
                          placeholder="Pharmacy name"
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrescriptionForm(false);
                          resetPrescriptionForm();
                        }}
                        className="btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!rxName || !rxDosage || !rxFrequency || isSubmitting}
                        className="btn-primary flex-1"
                      >
                        {isSubmitting ? "Saving..." : "Add Medication"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Active Prescriptions */}
          {activePrescriptions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-sage-500 uppercase tracking-wider mb-3">
                Active Medications
              </h3>
              <div className="space-y-3">
                {activePrescriptions.map((rx) => (
                  <div key={rx.id} className="card p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-2xl">
                          medication
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-sage-900 dark:text-white">
                              {rx.name}
                            </h4>
                            <p className="text-primary-600 dark:text-primary-400 font-medium">
                              {rx.dosage} • {rx.frequency}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rx.status)}`}>
                            {rx.status}
                          </span>
                        </div>
                        {rx.instructions && (
                          <p className="text-sm text-sage-600 dark:text-sage-400 mt-2">
                            {rx.instructions}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-sage-500 mt-2">
                          {rx.prescribedBy && (
                            <span>Prescribed by: {rx.prescribedBy}</span>
                          )}
                          {rx.pharmacy && <span>Pharmacy: {rx.pharmacy}</span>}
                          {rx.refillDate && (
                            <span className={new Date(rx.refillDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? "text-amber-600 dark:text-amber-400 font-medium" : ""}>
                              Refill: {new Date(rx.refillDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Prescriptions */}
          {prescriptions.filter((rx) => rx.status !== "ACTIVE").length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-sage-500 uppercase tracking-wider mb-3">
                Other Medications
              </h3>
              <div className="space-y-3">
                {prescriptions
                  .filter((rx) => rx.status !== "ACTIVE")
                  .map((rx) => (
                    <div key={rx.id} className="card p-4 opacity-70">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-700 flex items-center justify-center">
                          <span className="material-symbols-rounded text-sage-500">
                            medication
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sage-700 dark:text-sage-300">
                            {rx.name}
                          </h4>
                          <p className="text-sm text-sage-500">
                            {rx.dosage} • {rx.frequency}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(rx.status)}`}>
                          {rx.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {prescriptions.length === 0 && (
            <div className="card p-8 text-center">
              <span className="material-symbols-rounded text-4xl text-sage-400 mb-4">
                medication
              </span>
              <h3 className="font-semibold text-sage-900 dark:text-white mb-2">
                No medications added
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                Keep track of {childName}&apos;s medications and dosages here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
