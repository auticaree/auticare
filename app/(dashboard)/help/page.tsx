import Link from "next/link";

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I add a child to my account?",
      answer:
        "Go to the Children section from your dashboard and click 'Add Child'. Fill in your child's information and create their profile. You can then invite care team members to collaborate.",
    },
    {
      question: "How do I invite a healthcare provider?",
      answer:
        "Navigate to your child's profile and click on 'Care Team'. Use the 'Invite Member' button to send an email invitation. The provider will receive a link to join your child's care team.",
    },
    {
      question: "How do video consultations work?",
      answer:
        "Video consultations are scheduled between you and your care team members. When it's time for your appointment, go to Video Visits and join the session. Visual aids are available during calls to help with communication.",
    },
    {
      question: "What are SOAP notes?",
      answer:
        "SOAP notes (Subjective, Objective, Assessment, Plan) are a standard format for clinical documentation. Clinicians use them to record observations, assessments, and treatment plans for each visit.",
    },
    {
      question: "How does the Garden feature work?",
      answer:
        "The Garden is a gamified reward system for children. Completing therapy tasks and activities earns points that help grow their virtual garden. This encourages engagement with their care plan.",
    },
    {
      question: "How is my data protected?",
      answer:
        "AutiCare uses industry-standard encryption and security practices. All data is stored securely and only shared with authorized care team members. We comply with healthcare data protection regulations.",
    },
  ];

  const contactOptions = [
    {
      icon: "forum",
      title: "Community",
      description: "Connect with other families",
      action: "Coming Soon",
      href: "/community",
    },
    {
      icon: "help",
      title: "Help Center",
      description: "Browse FAQs below",
      action: "View FAQs",
      href: "#faqs",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 mb-4">
          <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-3xl">
            help
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-sage-900 dark:text-white">
          Help & Support
        </h1>
        <p className="text-sage-600 dark:text-sage-400 mt-2 max-w-lg mx-auto">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="relative">
          <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-sage-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search for help topics..."
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactOptions.map((option) => (
          <a
            key={option.title}
            href={option.href}
            className="card p-6 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-2xl">
                {option.icon}
              </span>
            </div>
            <h3 className="font-medium text-sage-900 dark:text-white">
              {option.title}
            </h3>
            <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">
              {option.description}
            </p>
            <p className="text-sm text-primary-600 dark:text-primary-400 mt-3">
              {option.action}
            </p>
          </a>
        ))}
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-sage-900 dark:text-white">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details key={index} className="card group">
              <summary className="p-4 cursor-pointer list-none flex items-center justify-between">
                <span className="font-medium text-sage-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                <span className="material-symbols-rounded text-sage-400 group-open:rotate-180 transition-transform">
                  expand_more
                </span>
              </summary>
              <div className="px-4 pb-4">
                <p className="text-sage-600 dark:text-sage-400">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card p-6">
        <h3 className="font-medium text-sage-900 dark:text-white mb-4">
          Quick Links
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/settings"
            className="p-3 rounded-xl bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors text-center"
          >
            <span className="material-symbols-rounded text-sage-600 dark:text-sage-400 block mb-1">
              settings
            </span>
            <span className="text-sm text-sage-900 dark:text-white">
              Settings
            </span>
          </Link>
          <Link
            href="/settings/security"
            className="p-3 rounded-xl bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors text-center"
          >
            <span className="material-symbols-rounded text-sage-600 dark:text-sage-400 block mb-1">
              lock
            </span>
            <span className="text-sm text-sage-900 dark:text-white">
              Security
            </span>
          </Link>
          <Link
            href="/settings/accessibility"
            className="p-3 rounded-xl bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors text-center"
          >
            <span className="material-symbols-rounded text-sage-600 dark:text-sage-400 block mb-1">
              accessibility
            </span>
            <span className="text-sm text-sage-900 dark:text-white">
              Accessibility
            </span>
          </Link>
          <Link
            href="/settings/notifications"
            className="p-3 rounded-xl bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors text-center"
          >
            <span className="material-symbols-rounded text-sage-600 dark:text-sage-400 block mb-1">
              notifications
            </span>
            <span className="text-sm text-sage-900 dark:text-white">
              Notifications
            </span>
          </Link>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="card p-6 border-coral-200 dark:border-coral-800/50 bg-coral-50 dark:bg-coral-900/10">
        <div className="flex items-start space-x-4">
          <span className="material-symbols-rounded text-coral-600 dark:text-coral-400 text-2xl shrink-0">
            warning
          </span>
          <div>
            <h3 className="font-medium text-coral-800 dark:text-coral-200">
              Emergency Situations
            </h3>
            <p className="text-sm text-coral-700 dark:text-coral-300 mt-1">
              AutiCare is not intended for medical emergencies. If you or your
              child are experiencing a medical emergency, please call 911 or go
              to your nearest emergency room immediately.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
