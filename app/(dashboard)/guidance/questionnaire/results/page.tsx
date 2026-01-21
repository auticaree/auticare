import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function QuestionnaireResultsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Get all questionnaire responses
    let responses;
    if (session.user.role === "PARENT") {
        const children = await prisma.childProfile.findMany({
            where: { parentId: session.user.id },
            select: { id: true },
        });
        const childIds = children.map((c) => c.id);

        responses = await prisma.questionnaireResponse.findMany({
            where: { childId: { in: childIds } },
            include: {
                child: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    } else {
        responses = await prisma.questionnaireResponse.findMany({
            where: { sharedWith: { has: session.user.id } },
            include: {
                child: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    const getScoreLevel = (score: number | null) => {
        if (!score) return { color: "sage", label: "Unknown" };
        const maxScore = 42;
        if (score < maxScore * 0.33) return { color: "primary", label: "Low Concern" };
        if (score < maxScore * 0.66) return { color: "lavender", label: "Moderate Concern" };
        return { color: "coral", label: "Higher Concern" };
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
                        Questionnaire Results
                    </h1>
                    <p className="text-sage-600 dark:text-sage-400 mt-1">
                        View past developmental screening results
                    </p>
                </div>
                {session.user.role === "PARENT" && (
                    <Link
                        href="/guidance/questionnaire"
                        className="btn-primary inline-flex items-center"
                    >
                        <span className="material-symbols-rounded mr-2">add</span>
                        New Questionnaire
                    </Link>
                )}
            </div>

            {/* Results List */}
            {responses.length > 0 ? (
                <div className="space-y-4">
                    {responses.map((response) => {
                        const { color, label } = getScoreLevel(response.score);
                        return (
                            <Link
                                key={response.id}
                                href={`/guidance/questionnaire/results/${response.id}`}
                                className="card p-5 items-center gap-4 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors group block"
                            >
                                <div
                                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${color === "primary"
                                        ? "bg-primary-100 dark:bg-primary-900/30"
                                        : color === "lavender"
                                            ? "bg-lavender-100 dark:bg-lavender-900/30"
                                            : color === "coral"
                                                ? "bg-coral-100 dark:bg-coral-900/30"
                                                : "bg-sage-100 dark:bg-sage-800"
                                        }`}
                                >
                                    <span
                                        className={`material-symbols-rounded text-2xl ${color === "primary"
                                            ? "text-primary-600 dark:text-primary-400"
                                            : color === "lavender"
                                                ? "text-lavender-600 dark:text-lavender-400"
                                                : color === "coral"
                                                    ? "text-coral-600 dark:text-coral-400"
                                                    : "text-sage-600 dark:text-sage-400"
                                            }`}
                                    >
                                        assignment
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-medium text-sage-900 dark:text-white">
                                            {response.child.name}
                                        </h3>
                                        <span
                                            className={`badge ${color === "primary"
                                                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                                                : color === "lavender"
                                                    ? "bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300"
                                                    : color === "coral"
                                                        ? "bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300"
                                                        : "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300"
                                                }`}
                                        >
                                            {label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-sage-500 dark:text-sage-400 mt-1">
                                        Completed{" "}
                                        {new Date(response.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="text-2xl font-semibold text-sage-900 dark:text-white">
                                            {response.score}
                                        </p>
                                        <p className="text-xs text-sage-500 dark:text-sage-400">
                                            Score
                                        </p>
                                    </div>
                                    <span className="material-symbols-rounded text-sage-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        chevron_right
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="card p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-sage-100 dark:bg-sage-800 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-rounded text-sage-400 text-3xl">
                            assignment
                        </span>
                    </div>
                    <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-2">
                        No Questionnaires Yet
                    </h3>
                    <p className="text-sage-600 dark:text-sage-400 mb-4">
                        Complete a developmental screening questionnaire to see results here.
                    </p>
                    {session.user.role === "PARENT" && (
                        <Link
                            href="/guidance/questionnaire"
                            className="btn-primary inline-flex items-center"
                        >
                            <span className="material-symbols-rounded mr-2">quiz</span>
                            Start Questionnaire
                        </Link>
                    )}
                </div>
            )}

            {/* Disclaimer */}
            <div className="card p-4 bg-sage-50 dark:bg-sage-800/50 border border-sage-200 dark:border-sage-700">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-rounded text-sage-500 dark:text-sage-400">
                        info
                    </span>
                    <div className="text-sm text-sage-600 dark:text-sage-400">
                        <p>
                            These results are for informational purposes only and do not
                            constitute a diagnosis. Always consult with a qualified healthcare
                            professional.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
