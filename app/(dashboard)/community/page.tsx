import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FeedbackForm } from "./feedback-form";

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Static announcements for pilot phase
  const announcements = [
    {
      id: "1",
      type: "update",
      title: "Welcome to AutiCare Pilot Program!",
      content:
        "Thank you for being one of our early users. Your feedback will help us build a better platform for families navigating autism care.",
      date: new Date().toISOString(),
      author: "AutiCare Team",
      icon: "celebration",
      color: "primary",
    },
    {
      id: "2",
      type: "feature",
      title: "New: Visual Schedules & AAC Tools",
      content:
        "Check out our new guidance resources including printable visual schedules for daily routines and communication boards for AAC support.",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      author: "AutiCare Team",
      icon: "new_releases",
      color: "teal",
      link: "/guidance/schedules",
    },
    {
      id: "3",
      type: "tip",
      title: "Tip: Track Symptoms for Better Care",
      content:
        "Use the Health Tracking feature on each child's profile to log symptoms and medications. This helps identify patterns and provides valuable information for care team discussions.",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      author: "AutiCare Team",
      icon: "lightbulb",
      color: "amber",
    },
    {
      id: "4",
      type: "event",
      title: "Autism Awareness Month Resources",
      content:
        "April is Autism Awareness Month. We've compiled resources and activities you can use to celebrate neurodiversity with your family and community.",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      author: "AutiCare Team",
      icon: "diversity_3",
      color: "lavender",
    },
  ];

  const resources = [
    {
      title: "Autism Speaks",
      description: "Resources, support, and advocacy information",
      url: "https://www.autismspeaks.org",
      icon: "language",
    },
    {
      title: "CDC Autism Resources",
      description: "Developmental milestones and screening information",
      url: "https://www.cdc.gov/ncbddd/autism/",
      icon: "health_and_safety",
    },
    {
      title: "ASAN - Autistic Self Advocacy",
      description: "Resources by and for autistic people",
      url: "https://autisticadvocacy.org",
      icon: "groups",
    },
    {
      title: "Understood.org",
      description: "Learning differences and support strategies",
      url: "https://www.understood.org",
      icon: "school",
    },
  ];

  const upcomingEvents = [
    {
      title: "Parent Support Group (Virtual)",
      date: "Every Tuesday, 7:00 PM EST",
      description: "Connect with other parents for peer support",
      type: "recurring",
    },
    {
      title: "Ask a Clinician Q&A",
      date: "Monthly - First Saturday",
      description: "Submit questions for our clinical advisory team",
      type: "monthly",
    },
  ];

  const getTypeColor = (color: string) => {
    const colors: Record<string, string> = {
      primary: "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400",
      teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
      amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
      lavender: "bg-lavender-100 dark:bg-lavender-900/30 text-lavender-600 dark:text-lavender-400",
      coral: "bg-coral-100 dark:bg-coral-900/30 text-coral-600 dark:text-coral-400",
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
          Community & News
        </h1>
        <p className="text-sage-600 dark:text-sage-400 mt-1">
          Updates, resources, and community connections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Announcements */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-sage-900 dark:text-white">
            Latest Updates
          </h2>

          {announcements.map((announcement) => (
            <div key={announcement.id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${getTypeColor(announcement.color)} flex items-center justify-center shrink-0`}>
                  <span className="material-symbols-rounded text-2xl">
                    {announcement.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sage-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    <span className="text-xs text-sage-500 dark:text-sage-400 whitespace-nowrap ml-4">
                      {new Date(announcement.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sage-600 dark:text-sage-400 mt-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-sage-500">
                      {announcement.author}
                    </span>
                    {announcement.link && (
                      <Link
                        href={announcement.link}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center"
                      >
                        Learn more
                        <span className="material-symbols-rounded text-sm ml-1">
                          arrow_forward
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Feedback Card */}
          <div className="card p-6 bg-linear-to-br from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 border-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-sage-800 shadow-sm flex items-center justify-center">
                <span className="material-symbols-rounded text-primary-500 text-2xl">
                  feedback
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sage-900 dark:text-white">
                  We Value Your Feedback
                </h3>
                <p className="text-sage-600 dark:text-sage-400 mt-1 mb-3">
                  As a pilot user, your input helps shape the future of AutiCare.
                  Let us know what features you'd like to see!
                </p>
                <FeedbackForm />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="card p-5">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded text-coral-500">
                event
              </span>
              Upcoming Events
            </h3>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div
                  key={index}
                  className="pb-4 border-b border-sage-100 dark:border-sage-700 last:border-0 last:pb-0"
                >
                  <h4 className="font-medium text-sage-900 dark:text-white text-sm">
                    {event.title}
                  </h4>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                    {event.date}
                  </p>
                  <p className="text-xs text-sage-500 mt-1">
                    {event.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Resources */}
          <div className="card p-5">
            <h3 className="font-semibold text-sage-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded text-teal-500">
                bookmark
              </span>
              Quick Resources
            </h3>
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors group"
                >
                  <span className="material-symbols-rounded text-sage-400 group-hover:text-primary-500 transition-colors">
                    {resource.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sage-900 dark:text-white truncate">
                      {resource.title}
                    </p>
                    <p className="text-xs text-sage-500 truncate">
                      {resource.description}
                    </p>
                  </div>
                  <span className="material-symbols-rounded text-sage-400 group-hover:text-primary-500 text-sm">
                    open_in_new
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Community Guidelines */}
          <div className="card p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded">info</span>
              Coming Soon
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              We're building features for parent-to-parent connections, discussion
              forums, and local resource sharing. Stay tuned!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
