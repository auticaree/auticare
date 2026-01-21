"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * ASD Screening Questionnaire - Technical Report V1.0
 * Based on: Auti-1.md specification
 * 
 * This questionnaire performs behavioral screening of signs associated with 
 * Autism Spectrum Disorder (ASD) in children, based on observations made by 
 * parents or legal guardians. It is NOT a diagnostic instrument.
 * 
 * Response Scale: Never (0), Rarely (1), Sometimes (2), Frequently (3), Always (4)
 * Total Score Range: 0-100 points (25 questions × 4 max points each)
 * 
 * Risk Classification:
 * - 0 to 29 points: Low risk
 * - 30 to 59 points: Moderate risk  
 * - 60 to 100 points: High risk
 */

interface Question {
    id: number;
    text: string;
    category: string;
}

// Complete 25 questions from Auti-1.md specification
const questions: Question[] = [
    // Section 1 – Communication and Language (5 questions)
    {
        id: 1,
        text: "The child took longer than expected to start speaking.",
        category: "Communication and Language",
    },
    {
        id: 2,
        text: "Avoids eye contact during conversations.",
        category: "Communication and Language",
    },
    {
        id: 3,
        text: "Does not respond when called by name.",
        category: "Communication and Language",
    },
    {
        id: 4,
        text: "Repeats words or phrases out of context (echolalia).",
        category: "Communication and Language",
    },
    {
        id: 5,
        text: "Has difficulty starting or maintaining a conversation.",
        category: "Communication and Language",
    },
    // Section 2 – Social Interaction (5 questions)
    {
        id: 6,
        text: "Shows little interest in playing with other children.",
        category: "Social Interaction",
    },
    {
        id: 7,
        text: "Has difficulty understanding other people's emotions.",
        category: "Social Interaction",
    },
    {
        id: 8,
        text: "Does not point to show interest (e.g., showing something they like).",
        category: "Social Interaction",
    },
    {
        id: 9,
        text: "Prefers to play alone most of the time.",
        category: "Social Interaction",
    },
    {
        id: 10,
        text: "Appears to be in their own world in social situations.",
        category: "Social Interaction",
    },
    // Section 3 – Repetitive Behaviors and Restricted Interests (5 questions)
    {
        id: 11,
        text: "Repeats movements such as hand flapping or body rocking.",
        category: "Repetitive Behaviors and Restricted Interests",
    },
    {
        id: 12,
        text: "Becomes very distressed when routines change.",
        category: "Repetitive Behaviors and Restricted Interests",
    },
    {
        id: 13,
        text: "Shows very intense interests in specific topics.",
        category: "Repetitive Behaviors and Restricted Interests",
    },
    {
        id: 14,
        text: "Lines up objects or always plays in the same way.",
        category: "Repetitive Behaviors and Restricted Interests",
    },
    {
        id: 15,
        text: "Insists that things be done in the same way every time.",
        category: "Repetitive Behaviors and Restricted Interests",
    },
    // Section 4 – Sensory Sensitivities (5 questions)
    {
        id: 16,
        text: "Reacts intensely to common sounds.",
        category: "Sensory Sensitivities",
    },
    {
        id: 17,
        text: "Avoids certain types of clothing or textures.",
        category: "Sensory Sensitivities",
    },
    {
        id: 18,
        text: "Shows discomfort with bright lights.",
        category: "Sensory Sensitivities",
    },
    {
        id: 19,
        text: "Smells, touches, or mouths objects more than expected.",
        category: "Sensory Sensitivities",
    },
    {
        id: 20,
        text: "Appears to have reduced or exaggerated pain sensitivity.",
        category: "Sensory Sensitivities",
    },
    // Section 5 – Development and General Behavior (5 questions)
    {
        id: 21,
        text: "Experienced regression (lost skills previously acquired).",
        category: "Development and General Behavior",
    },
    {
        id: 22,
        text: "Has difficulty imitating gestures or actions.",
        category: "Development and General Behavior",
    },
    {
        id: 23,
        text: "Displays intense emotional outbursts without clear cause.",
        category: "Development and General Behavior",
    },
    {
        id: 24,
        text: "Has difficulty understanding simple rules.",
        category: "Development and General Behavior",
    },
    {
        id: 25,
        text: "Shows developmental delay compared to children of the same age.",
        category: "Development and General Behavior",
    },
];

// Response scale per Auti-1.md: Never (0), Rarely (1), Sometimes (2), Frequently (3), Always (4)
const answerOptions = [
    { value: 0, label: "Never", color: "bg-primary-500" },
    { value: 1, label: "Rarely", color: "bg-teal-500" },
    { value: 2, label: "Sometimes", color: "bg-amber-500" },
    { value: 3, label: "Frequently", color: "bg-orange-500" },
    { value: 4, label: "Always", color: "bg-coral-500" },
];

const categories = [
    "Communication and Language",
    "Social Interaction",
    "Repetitive Behaviors and Restricted Interests",
    "Sensory Sensitivities",
    "Development and General Behavior",
];

export default function QuestionnaireClient({
    children,
}: {
    children: { id: string; name: string }[];
}) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<"consent" | "child" | "questions" | "submitting">("consent");
    const [selectedChild, setSelectedChild] = useState<string>("");
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [shareConsent, setShareConsent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [consentChecked, setConsentChecked] = useState(false);

    const handleAnswer = (questionId: number, value: number) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        // Auto-advance after short delay
        if (currentQuestion < questions.length - 1) {
            setTimeout(() => setCurrentQuestion((prev) => prev + 1), 300);
        }
    };

    // Calculate score: sum of all responses (0-100 scale)
    const calculateScore = () => {
        let score = 0;
        Object.values(answers).forEach((value) => {
            score += value;
        });
        return score;
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            setError("Please answer all 25 questions before submitting.");
            return;
        }

        setCurrentStep("submitting");
        setError(null);

        const score = calculateScore();
        const responsesArray = questions.map((q) => ({
            questionId: q.id,
            questionText: q.text,
            category: q.category,
            answer: answerOptions[answers[q.id]].label,
            value: answers[q.id],
        }));

        try {
            const response = await fetch("/api/questionnaire", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    childId: selectedChild,
                    responses: responsesArray,
                    score,
                    shareConsent,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to submit questionnaire");
            }

            const data = await response.json();
            router.push(`/guidance/questionnaire/results/${data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit questionnaire. Please try again.");
            setCurrentStep("questions");
        }
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;
    const currentQ = questions[currentQuestion];
    const currentCategoryIndex = categories.indexOf(currentQ?.category);

    // Get category progress
    const getCategoryProgress = (category: string) => {
        const categoryQuestions = questions.filter(q => q.category === category);
        const answeredInCategory = categoryQuestions.filter(q => answers[q.id] !== undefined).length;
        return { answered: answeredInCategory, total: categoryQuestions.length };
    };

    // Consent Step
    if (currentStep === "consent") {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400 text-3xl">
                                assignment
                            </span>
                        </div>
                        <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
                            ASD Screening Questionnaire
                        </h1>
                        <p className="text-sage-600 dark:text-sage-400 mt-2">
                            Behavioral Screening for Autism Spectrum Disorder
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Important Disclaimer */}
                        <div className="p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-rounded text-coral-600 dark:text-coral-400">
                                    warning
                                </span>
                                <div>
                                    <h3 className="font-medium text-coral-800 dark:text-coral-200 mb-1">
                                        Important Disclaimer
                                    </h3>
                                    <p className="text-sm text-coral-700 dark:text-coral-300">
                                        This questionnaire is a <strong>screening tool</strong> and does{" "}
                                        <strong>NOT replace medical, psychological, or diagnostic evaluation</strong>.{" "}
                                        The result only indicates the presence of behavioral signs that may be
                                        associated with ASD. Only licensed healthcare professionals can diagnose
                                        autism spectrum disorder.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* About This Questionnaire */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-sage-900 dark:text-white">
                                About This Questionnaire
                            </h3>
                            <ul className="space-y-2 text-sm text-sage-600 dark:text-sage-400">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-rounded text-primary-500 text-sm mt-0.5">
                                        check_circle
                                    </span>
                                    Contains <strong>25 questions</strong> across 5 developmental areas
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-rounded text-primary-500 text-sm mt-0.5">
                                        check_circle
                                    </span>
                                    Takes approximately <strong>10-15 minutes</strong> to complete
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-rounded text-primary-500 text-sm mt-0.5">
                                        check_circle
                                    </span>
                                    Based on observations by parents or legal guardians
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-rounded text-primary-500 text-sm mt-0.5">
                                        check_circle
                                    </span>
                                    Conceptual basis aligned with <strong>DSM-5</strong> criteria
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-rounded text-primary-500 text-sm mt-0.5">
                                        check_circle
                                    </span>
                                    Results can be shared with your care team (optional)
                                </li>
                            </ul>
                        </div>

                        {/* Assessment Areas */}
                        <div className="space-y-3">
                            <h3 className="font-medium text-sage-900 dark:text-white">
                                Areas Assessed
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {categories.map((cat, idx) => (
                                    <div
                                        key={cat}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-sage-50 dark:bg-sage-800/50"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-medium text-primary-600 dark:text-primary-400">
                                            {idx + 1}
                                        </span>
                                        <span className="text-sm text-sage-700 dark:text-sage-300">{cat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Classification */}
                        <div className="p-4 rounded-xl bg-sage-50 dark:bg-sage-800/50">
                            <h3 className="font-medium text-sage-900 dark:text-white mb-3">
                                Risk Classification
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-primary-500"></span>
                                    <span className="text-sage-600 dark:text-sage-400">
                                        <strong>0-29 points:</strong> Low risk - Few behavioral signs observed
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                    <span className="text-sage-600 dark:text-sage-400">
                                        <strong>30-59 points:</strong> Moderate risk - Some signs present; follow-up recommended
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-coral-500"></span>
                                    <span className="text-sage-600 dark:text-sage-400">
                                        <strong>60-100 points:</strong> High risk - Professional evaluation recommended
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Consent Checkbox */}
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-200 dark:border-lavender-800">
                            <input
                                type="checkbox"
                                id="consent"
                                checked={consentChecked}
                                onChange={(e) => setConsentChecked(e.target.checked)}
                                className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-sage-300 rounded"
                            />
                            <label
                                htmlFor="consent"
                                className="text-sm text-sage-700 dark:text-sage-300"
                            >
                                I understand that this is a <strong>screening tool only</strong> and does not
                                provide a diagnosis. I confirm that I am the parent or legal guardian, and I
                                agree to answer questions based on my observations of the child.
                            </label>
                        </div>

                        {/* Share with care team option */}
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-sage-200 dark:border-sage-700">
                            <input
                                type="checkbox"
                                id="shareConsent"
                                checked={shareConsent}
                                onChange={(e) => setShareConsent(e.target.checked)}
                                className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 border-sage-300 rounded"
                            />
                            <label
                                htmlFor="shareConsent"
                                className="text-sm text-sage-700 dark:text-sage-300"
                            >
                                <strong>Optional:</strong> Share results with professionals who have access to
                                this child&apos;s profile (clinicians, therapists).
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-sage-100 dark:border-sage-800">
                        <Link
                            href="/guidance"
                            className="text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-sm">
                                arrow_back
                            </span>
                            Back to Guidance
                        </Link>
                        <button
                            onClick={() => setCurrentStep("child")}
                            disabled={!consentChecked}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Child Selection Step
    if (currentStep === "child") {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-xl font-semibold text-sage-900 dark:text-white">
                            Select Child
                        </h2>
                        <p className="text-sage-600 dark:text-sage-400 mt-2">
                            Choose which child this questionnaire is for
                        </p>
                    </div>

                    <div className="space-y-3">
                        {children.map((child) => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChild(child.id)}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${selectedChild === child.id
                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                    : "border-sage-200 dark:border-sage-700 hover:border-sage-300 dark:hover:border-sage-600"
                                    }`}
                            >
                                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white font-medium text-lg">
                                    {child.name.charAt(0)}
                                </div>
                                <span className="font-medium text-sage-900 dark:text-white">
                                    {child.name}
                                </span>
                                {selectedChild === child.id && (
                                    <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 ml-auto">
                                        check_circle
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-sage-100 dark:border-sage-800">
                        <button
                            onClick={() => setCurrentStep("consent")}
                            className="text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-sm">
                                arrow_back
                            </span>
                            Back
                        </button>
                        <button
                            onClick={() => setCurrentStep("questions")}
                            disabled={!selectedChild}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Questionnaire
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Submitting Step
    if (currentStep === "submitting") {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mx-auto mb-6" />
                    <h2 className="text-xl font-semibold text-sage-900 dark:text-white mb-2">
                        Processing Results
                    </h2>
                    <p className="text-sage-600 dark:text-sage-400">
                        Analyzing your responses...
                    </p>
                </div>
            </div>
        );
    }

    // Questions Step
    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-sage-600 dark:text-sage-400">
                        Question {currentQuestion + 1} of {questions.length}
                    </span>
                    <span className="text-sm font-medium text-sage-500 dark:text-sage-400">
                        {answeredCount} answered
                    </span>
                </div>
                <div className="h-2 bg-sage-100 dark:bg-sage-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-primary-400 to-teal-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Category Progress Pills */}
                <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
                    {categories.map((category, index) => {
                        const catProgress = getCategoryProgress(category);
                        const isComplete = catProgress.answered === catProgress.total;
                        const isCurrent = index === currentCategoryIndex;

                        return (
                            <span
                                key={category}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1 ${isCurrent
                                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500"
                                        : isComplete
                                            ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                                            : "bg-sage-100 dark:bg-sage-800 text-sage-500 dark:text-sage-400"
                                    }`}
                            >
                                {isComplete && (
                                    <span className="material-symbols-rounded text-xs">check</span>
                                )}
                                {category.split(" ").slice(0, 2).join(" ")}
                                <span className="opacity-60">
                                    ({catProgress.answered}/{catProgress.total})
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Question Card */}
            <div className="card p-8">
                <div className="mb-8">
                    <span className="inline-block px-3 py-1 rounded-full bg-sage-100 dark:bg-sage-800 text-sage-600 dark:text-sage-400 text-xs font-medium mb-4">
                        Section {currentCategoryIndex + 1}: {currentQ.category}
                    </span>
                    <h2 className="text-xl font-semibold text-sage-900 dark:text-white">
                        {currentQ.text}
                    </h2>
                    <p className="text-sm text-sage-500 dark:text-sage-400 mt-2">
                        Rate how often this applies to your child
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800">
                        <p className="text-sm text-coral-700 dark:text-coral-300">{error}</p>
                    </div>
                )}

                <div className="space-y-3">
                    {answerOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleAnswer(currentQ.id, option.value)}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${answers[currentQ.id] === option.value
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-sage-200 dark:border-sage-700 hover:border-sage-300 dark:hover:border-sage-600"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${option.color}`}>
                                    {option.value}
                                </span>
                                <span className="font-medium text-sage-900 dark:text-white">
                                    {option.label}
                                </span>
                            </div>
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQ.id] === option.value
                                    ? "border-primary-500 bg-primary-500"
                                    : "border-sage-300 dark:border-sage-600"
                                    }`}
                            >
                                {answers[currentQ.id] === option.value && (
                                    <span className="material-symbols-rounded text-white text-sm">check</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-sage-100 dark:border-sage-800">
                    <button
                        onClick={() =>
                            currentQuestion > 0
                                ? setCurrentQuestion((prev) => prev - 1)
                                : setCurrentStep("child")
                        }
                        className="text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white flex items-center gap-2"
                    >
                        <span className="material-symbols-rounded text-sm">arrow_back</span>
                        {currentQuestion > 0 ? "Previous" : "Back"}
                    </button>

                    {currentQuestion === questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={answeredCount < questions.length}
                            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Submit ({answeredCount}/{questions.length})
                            <span className="material-symbols-rounded text-sm">send</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestion((prev) => prev + 1)}
                            disabled={answers[currentQ.id] === undefined}
                            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Next
                            <span className="material-symbols-rounded text-sm">
                                arrow_forward
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Navigation Grid */}
            <div className="mt-6">
                <p className="text-xs text-sage-500 dark:text-sage-400 text-center mb-3">
                    Click to jump to any question
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                    {questions.map((q, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentQuestion(index)}
                            title={`Q${index + 1}: ${q.text.substring(0, 50)}...`}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${index === currentQuestion
                                ? "bg-primary-500 text-white ring-2 ring-primary-300"
                                : answers[questions[index].id] !== undefined
                                    ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                                    : "bg-sage-100 dark:bg-sage-800 text-sage-500 dark:text-sage-400 hover:bg-sage-200 dark:hover:bg-sage-700"
                                }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>

            {/* Incomplete Questions Warning */}
            {currentQuestion === questions.length - 1 && answeredCount < questions.length && (
                <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-rounded text-amber-600 dark:text-amber-400">
                            info
                        </span>
                        <div>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                <strong>{questions.length - answeredCount} questions</strong> remaining.
                                Please answer all questions before submitting.
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {questions
                                    .filter((q) => answers[q.id] === undefined)
                                    .slice(0, 10)
                                    .map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setCurrentQuestion(q.id - 1)}
                                            className="px-2 py-0.5 text-xs rounded bg-amber-100 dark:bg-amber-800/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200"
                                        >
                                            Q{q.id}
                                        </button>
                                    ))}
                                {questions.filter((q) => answers[q.id] === undefined).length > 10 && (
                                    <span className="px-2 py-0.5 text-xs text-amber-600">
                                        +{questions.filter((q) => answers[q.id] === undefined).length - 10} more
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
