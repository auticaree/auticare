import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function GuidancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Get children for questionnaire context
  const children = session.user.role === "PARENT"
    ? await prisma.childProfile.findMany({
      where: { parentId: session.user.id },
      select: { id: true, name: true },
    })
    : [];

  const guidanceTips = [
    {
      icon: "routine",
      title: "Visual Schedules",
      description:
        "Use pictures and symbols to create predictable daily routines. Visual schedules help reduce anxiety by showing what comes next.",
      color: "primary",
    },
    {
      icon: "volume_down",
      title: "Sensory Considerations",
      description:
        "Create calm spaces with dim lighting and reduced noise. Consider noise-canceling headphones for overwhelming environments.",
      color: "teal",
    },
    {
      icon: "schedule",
      title: "Transition Warnings",
      description:
        "Give advance notice before activities change. Use timers or countdowns to help prepare for transitions.",
      color: "lavender",
    },
    {
      icon: "communication",
      title: "Clear Communication",
      description:
        "Use simple, concrete language. Avoid idioms and be direct. Give one instruction at a time.",
      color: "sage",
    },
    {
      icon: "self_improvement",
      title: "Calming Strategies",
      description:
        "Practice deep breathing exercises. Identify and use preferred sensory items for self-regulation.",
      color: "coral",
    },
    {
      icon: "celebration",
      title: "Celebrate Strengths",
      description:
        "Focus on what your child does well. Build activities around their interests and special talents.",
      color: "primary",
    },
  ];

  const resources = [
    {
      title: "Visual Schedules",
      description: "Printable daily routine templates",
      icon: "calendar_view_day",
      href: "/guidance/schedules",
    },
    {
      title: "Communication Board",
      description: "AAC tools and visual aids",
      icon: "forum",
      href: "/guidance/aac",
    },
    {
      title: "Behavior Support",
      description: "Positive behavior strategies",
      icon: "psychology",
      href: "#",
    },
    {
      title: "Sensory Activities",
      description: "Sensory-friendly activities and ideas",
      icon: "toys",
      href: "#",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Parent Guidance
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mt-1">
            Practical tips and resources to support your child's wellbeing
          </p>
        </div>
        {session.user.role === "PARENT" && children.length > 0 && (
          <Link
            href="/guidance/questionnaire"
            className="btn-primary inline-flex items-center self-start"
          >
            <span className="material-symbols-rounded mr-2">quiz</span>
            Developmental Screening
          </Link>
        )}
      </div>

      {/* Daily Tips Banner */}
      <div className="card overflow-hidden">
        <div className="p-6 bg-linear-to-br from-primary-400 to-teal-500 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium mb-3">
                <span className="material-symbols-rounded text-sm mr-1">
                  lightbulb
                </span>
                Tip of the Day
              </span>
              <h2 className="text-xl font-semibold mb-2">
                Create Predictable Routines
              </h2>
              <p className="text-white/90">
                Children with autism often thrive with predictable routines.
                Consider using a visual schedule board with pictures for each
                daily activity. This helps reduce anxiety and provides a sense
                of security.
              </p>
            </div>
            <span className="material-symbols-rounded text-6xl text-white/20 hidden sm:block">
              tips_and_updates
            </span>
          </div>
        </div>
      </div>

      {/* Guidance Tips Grid */}
      <div>
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
          Daily Support Strategies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guidanceTips.map((tip, index) => (
            <div
              key={index}
              className="card p-5 hover:shadow-lg transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${tip.color}-100 dark:bg-${tip.color}-900/30`}
              >
                <span
                  className={`material-symbols-rounded text-${tip.color}-600 dark:text-${tip.color}-400 text-2xl`}
                >
                  {tip.icon}
                </span>
              </div>
              <h3 className="font-medium text-sage-900 dark:text-white mb-2">
                {tip.title}
              </h3>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Screening Questionnaire Card */}
      {session.user.role === "PARENT" && children.length > 0 && (
        <div className="card overflow-hidden border-2 border-dashed border-sage-200 dark:border-sage-700">
          <div className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400 text-4xl">
                assignment
              </span>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white">
                Developmental Screening Questionnaire
              </h3>
              <p className="text-sage-600 dark:text-sage-400 mt-1 mb-3">
                This brief questionnaire helps identify areas where your child
                may benefit from additional support. Results are for informational
                purposes only and do not constitute a diagnosis.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <Link
                  href="/guidance/questionnaire"
                  className="btn-secondary inline-flex items-center"
                >
                  <span className="material-symbols-rounded mr-2">quiz</span>
                  Start Questionnaire
                </Link>
                <Link
                  href="/guidance/questionnaire/results"
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View Past Results
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resources Section */}
      <div>
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
          Learning Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {resources.map((resource, index) => (
            <Link
              key={index}
              href={resource.href}
              className="card p-5 flex items-center gap-4 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-sage-100 dark:bg-sage-800 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                <span className="material-symbols-rounded text-sage-600 dark:text-sage-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 text-2xl transition-colors">
                  {resource.icon}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sage-900 dark:text-white">
                  {resource.title}
                </h3>
                <p className="text-sm text-sage-600 dark:text-sage-400">
                  {resource.description}
                </p>
              </div>
              <span className="material-symbols-rounded text-sage-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="card p-4 bg-sage-50 dark:bg-sage-800/50 border border-sage-200 dark:border-sage-700">
        <div className="flex items-start gap-3">
          <span className="material-symbols-rounded text-sage-500 dark:text-sage-400">
            info
          </span>
          <div className="text-sm text-sage-600 dark:text-sage-400">
            <p className="font-medium text-sage-700 dark:text-sage-300 mb-1">
              Important Information
            </p>
            <p>
              The guidance provided here is for informational purposes only and
              does not replace professional medical advice. Always consult with
              your child's healthcare team for personalized recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
