import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function VisualSchedulesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const scheduleTemplates = [
    {
      id: "morning",
      title: "Morning Routine",
      description: "Wake up, bathroom, breakfast, get dressed",
      icon: "wb_sunny",
      color: "amber",
      steps: [
        { icon: "alarm", label: "Wake Up" },
        { icon: "bathroom", label: "Bathroom" },
        { icon: "restaurant", label: "Breakfast" },
        { icon: "checkroom", label: "Get Dressed" },
        { icon: "backpack", label: "Pack Bag" },
      ],
    },
    {
      id: "afterschool",
      title: "After School",
      description: "Snack, homework, play, dinner",
      icon: "school",
      color: "primary",
      steps: [
        { icon: "home", label: "Come Home" },
        { icon: "cookie", label: "Snack" },
        { icon: "menu_book", label: "Homework" },
        { icon: "toys", label: "Play Time" },
        { icon: "dinner_dining", label: "Dinner" },
      ],
    },
    {
      id: "bedtime",
      title: "Bedtime Routine",
      description: "Bath, pajamas, brush teeth, story, sleep",
      icon: "bedtime",
      color: "lavender",
      steps: [
        { icon: "bathtub", label: "Bath Time" },
        { icon: "dry_cleaning", label: "Pajamas" },
        { icon: "mood", label: "Brush Teeth" },
        { icon: "auto_stories", label: "Story" },
        { icon: "bed", label: "Sleep" },
      ],
    },
    {
      id: "weekend",
      title: "Weekend Day",
      description: "Flexible weekend activities",
      icon: "weekend",
      color: "teal",
      steps: [
        { icon: "wb_sunny", label: "Wake Up" },
        { icon: "restaurant", label: "Breakfast" },
        { icon: "sports_esports", label: "Free Time" },
        { icon: "lunch_dining", label: "Lunch" },
        { icon: "family_restroom", label: "Family Activity" },
      ],
    },
  ];

  const tips = [
    {
      title: "Keep It Simple",
      description: "Start with 3-5 steps. Add more as your child gets comfortable.",
      icon: "format_list_numbered",
    },
    {
      title: "Use Real Photos",
      description: "Pictures of actual items and places can be more meaningful.",
      icon: "photo_camera",
    },
    {
      title: "Be Consistent",
      description: "Use the same schedule in the same place each day.",
      icon: "repeat",
    },
    {
      title: "Make It Interactive",
      description: "Let your child move items or check off completed steps.",
      icon: "touch_app",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/guidance"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Visual Schedules
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Printable visual schedule templates for daily routines
          </p>
        </div>
      </div>

      {/* Introduction */}
      <div className="card p-6 bg-linear-to-br from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 border-0">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-sage-800 shadow-sm flex items-center justify-center shrink-0">
            <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-3xl">
              view_agenda
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
              Why Visual Schedules Help
            </h2>
            <p className="text-sage-700 dark:text-sage-300">
              Visual schedules provide predictability and reduce anxiety by showing what comes next.
              They support independence, improve transitions between activities, and can be customized
              to match your child's specific needs and preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Templates */}
      <div>
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
          Schedule Templates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scheduleTemplates.map((template) => (
            <div key={template.id} className="card overflow-hidden">
              {/* Template Header */}
              <div className={`p-4 bg-${template.color}-100 dark:bg-${template.color}-900/30`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-white dark:bg-sage-800 shadow-sm flex items-center justify-center`}>
                    <span className={`material-symbols-rounded text-${template.color}-600 dark:text-${template.color}-400 text-2xl`}>
                      {template.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sage-900 dark:text-white">
                      {template.title}
                    </h3>
                    <p className="text-sm text-sage-600 dark:text-sage-400">
                      {template.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Steps */}
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {template.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center p-3 bg-sage-50 dark:bg-sage-800 rounded-xl min-w-20"
                    >
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-sage-700 shadow-sm flex items-center justify-center mb-2">
                        <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                          {step.icon}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-sage-700 dark:text-sage-300 text-center">
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-sage-100 dark:border-sage-800 flex justify-end gap-2">
                <button className="btn-secondary text-sm py-2">
                  <span className="material-symbols-rounded text-sm mr-1">edit</span>
                  Customize
                </button>
                <button className="btn-primary text-sm py-2">
                  <span className="material-symbols-rounded text-sm mr-1">print</span>
                  Print
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Custom Schedule */}
      <div className="card p-6 border-2 border-dashed border-sage-200 dark:border-sage-700">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-sage-100 dark:bg-sage-800 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-sage-500 dark:text-sage-400 text-3xl">
              add_circle
            </span>
          </div>
          <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
            Create Custom Schedule
          </h3>
          <p className="text-sage-600 dark:text-sage-400 mb-4 max-w-md mx-auto">
            Build a personalized visual schedule with your own activities and images.
          </p>
          <button className="btn-secondary">
            <span className="material-symbols-rounded mr-2">add</span>
            Create New Schedule
          </button>
        </div>
      </div>

      {/* Tips */}
      <div>
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
          Tips for Using Visual Schedules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tips.map((tip, index) => (
            <div key={index} className="card p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-primary-600 dark:text-primary-400">
                  {tip.icon}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-sage-900 dark:text-white">
                  {tip.title}
                </h4>
                <p className="text-sm text-sage-600 dark:text-sage-400">
                  {tip.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
