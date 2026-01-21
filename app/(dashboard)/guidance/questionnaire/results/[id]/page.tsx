import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createAuditLog } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

interface ResponseItem {
  questionId: number;
  questionText: string;
  category: string;
  answer: string;
  value: number;
}

export default async function QuestionnaireResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  // Get the questionnaire response
  const response = await prisma.questionnaireResponse.findUnique({
    where: { id },
    include: {
      child: {
        select: { id: true, name: true, parentId: true },
      },
      responder: {
        select: { id: true, name: true },
      },
    },
  });

  if (!response) {
    notFound();
  }

  // Check access permissions
  const isParent =
    session.user.role === "PARENT" &&
    response.child.parentId === session.user.id;
  const isSharedProfessional = response.sharedWith.includes(session.user.id!);
  const isAdmin = session.user.role === "ADMIN";

  if (!isParent && !isSharedProfessional && !isAdmin) {
    redirect("/guidance/questionnaire/results");
  }

  // Log the view
  await createAuditLog({
    userId: session.user.id!,
    action: AuditAction.RECORD_VIEWED,
    targetType: "QuestionnaireResponse",
    targetId: response.id,
    metadata: {
      childId: response.child.id,
      childName: response.child.name,
    },
  });

  // Parse responses
  const parsedResponses: ResponseItem[] = JSON.parse(response.responses);

  // Group by category
  const categories = parsedResponses.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ResponseItem[]>);

  // Calculate score details
  const maxScore = 42;
  const scorePercentage = ((response.score || 0) / maxScore) * 100;

  const getScoreLevel = () => {
    const score = response.score || 0;
    if (score < maxScore * 0.33)
      return {
        color: "primary",
        label: "Low Concern",
        icon: "check_circle",
        description:
          "Responses suggest typical development patterns in the areas assessed.",
      };
    if (score < maxScore * 0.66)
      return {
        color: "lavender",
        label: "Moderate Concern",
        icon: "info",
        description:
          "Some areas may benefit from professional evaluation and monitoring.",
      };
    return {
      color: "coral",
      label: "Higher Concern",
      icon: "warning",
      description:
        "We recommend discussing these results with a developmental specialist.",
    };
  };

  const scoreLevel = getScoreLevel();

  const getAnswerColor = (value: number) => {
    switch (value) {
      case 0:
        return "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300";
      case 1:
        return "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300";
      case 2:
        return "bg-lavender-100 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300";
      case 3:
        return "bg-coral-100 dark:bg-coral-900/30 text-coral-700 dark:text-coral-300";
      default:
        return "bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/guidance/questionnaire/results"
        className="inline-flex items-center text-sage-600 dark:text-sage-400 hover:text-sage-900 dark:hover:text-white"
      >
        <span className="material-symbols-rounded mr-1">arrow_back</span>
        Back to Results
      </Link>

      {/* Header Card */}
      <div className="card overflow-hidden">
        <div
          className={`p-6 ${scoreLevel.color === "primary"
              ? "bg-linear-to-br from-primary-400 to-teal-500"
              : scoreLevel.color === "lavender"
                ? "bg-linear-to-br from-lavender-400 to-lavender-600"
                : "bg-linear-to-br from-coral-400 to-coral-600"
            } text-white`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-rounded text-2xl">
                  {scoreLevel.icon}
                </span>
                <span className="text-lg font-semibold">{scoreLevel.label}</span>
              </div>
              <h1 className="text-2xl font-bold mb-1">
                Screening Results for {response.child.name}
              </h1>
              <p className="text-white/80">
                Completed on{" "}
                {new Date(response.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{response.score}</div>
              <div className="text-white/80 text-sm">of {maxScore}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Score Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-sage-600 dark:text-sage-400">
                Overall Score
              </span>
              <span className="font-medium text-sage-900 dark:text-white">
                {Math.round(scorePercentage)}%
              </span>
            </div>
            <div className="h-3 bg-sage-100 dark:bg-sage-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${scoreLevel.color === "primary"
                    ? "bg-primary-500"
                    : scoreLevel.color === "lavender"
                      ? "bg-lavender-500"
                      : "bg-coral-500"
                  }`}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-sage-500 dark:text-sage-400 mt-1">
              <span>Low Concern</span>
              <span>Moderate</span>
              <span>Higher Concern</span>
            </div>
          </div>

          {/* Result Summary */}
          <div
            className={`p-4 rounded-xl ${scoreLevel.color === "primary"
                ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                : scoreLevel.color === "lavender"
                  ? "bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-200 dark:border-lavender-800"
                  : "bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800"
              }`}
          >
            <p
              className={`text-sm ${scoreLevel.color === "primary"
                  ? "text-primary-800 dark:text-primary-200"
                  : scoreLevel.color === "lavender"
                    ? "text-lavender-800 dark:text-lavender-200"
                    : "text-coral-800 dark:text-coral-200"
                }`}
            >
              {response.result}
            </p>
          </div>
        </div>
      </div>

      {/* Responses by Category */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white">
          Detailed Responses
        </h2>

        {Object.entries(categories).map(([category, items]) => (
          <div key={category} className="card overflow-hidden">
            <div className="p-4 bg-sage-50 dark:bg-sage-800/50 border-b border-sage-100 dark:border-sage-700">
              <h3 className="font-medium text-sage-900 dark:text-white">
                {category}
              </h3>
            </div>
            <div className="divide-y divide-sage-100 dark:divide-sage-800">
              {items.map((item) => (
                <div
                  key={item.questionId}
                  className="p-4 flex items-center justify-between gap-4"
                >
                  <p className="text-sage-700 dark:text-sage-300 flex-1">
                    {item.questionText}
                  </p>
                  <span
                    className={`badge shrink-0 ${getAnswerColor(item.value)}`}
                  >
                    {item.answer}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sharing Info */}
      {response.sharedWith.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-rounded text-sage-500 dark:text-sage-400">
              share
            </span>
            <div>
              <p className="text-sm font-medium text-sage-900 dark:text-white">
                Shared with Care Team
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                This questionnaire has been shared with {response.sharedWith.length}{" "}
                care team member(s).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <span className="material-symbols-rounded text-amber-600 dark:text-amber-400">
            warning
          </span>
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-1">
              Important Disclaimer
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              This screening questionnaire is for informational purposes only
              and does not constitute a diagnostic assessment. The results
              should not be used to diagnose or treat any condition. Always
              consult with qualified healthcare professionals for proper
              evaluation and guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/guidance"
          className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-rounded text-sm">lightbulb</span>
          View Guidance Tips
        </Link>
        {isParent && (
          <Link
            href="/guidance/questionnaire"
            className="btn-secondary inline-flex items-center"
          >
            <span className="material-symbols-rounded mr-2">refresh</span>
            Take New Questionnaire
          </Link>
        )}
      </div>
    </div>
  );
}
