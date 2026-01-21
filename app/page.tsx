import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sage-50 via-white to-primary-50 dark:from-sage-950 dark:via-sage-900 dark:to-primary-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-sage-900/80 border-b border-sage-200/50 dark:border-sage-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-glow">
                <img src="/logo.jpeg" alt="AutiCare" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-semibold text-sage-900 dark:text-white">
                AutiCare
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-sage-600 dark:text-sage-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sage-600 dark:text-sage-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                How It Works
              </a>
              <a
                href="#security"
                className="text-sage-600 dark:text-sage-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Security
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sage-700 dark:text-sage-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
              <span className="material-symbols-rounded text-sm mr-2">
                verified
              </span>
              HIPAA Compliant & Secure
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sage-900 dark:text-white mb-6 leading-tight">
              Coordinated care for{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-500 to-teal-500">
                your child&apos;s
              </span>{" "}
              unique journey
            </h1>
            <p className="text-xl text-sage-600 dark:text-sage-400 mb-8 max-w-2xl mx-auto">
              Connect parents, clinicians, and support professionals in one calm,
              secure space. Built specifically for families navigating autism
              spectrum support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                <span className="material-symbols-rounded mr-2">rocket_launch</span>
                Start Free Trial
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary text-lg px-8 py-4"
              >
                <span className="material-symbols-rounded mr-2">play_circle</span>
                See How It Works
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-linear-to-t from-sage-50 dark:from-sage-950 to-transparent z-10 pointer-events-none" />
            <div className="relative mx-auto max-w-5xl">
              <div className="card-glass p-8 rounded-3xl shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Dashboard Preview */}
                  <div className="card bg-white dark:bg-sage-800 p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-sm">
                          home
                        </span>
                      </div>
                      <span className="font-medium text-sage-700 dark:text-sage-300">
                        Dashboard
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-sage-100 dark:bg-sage-700 rounded w-full" />
                      <div className="h-3 bg-sage-100 dark:bg-sage-700 rounded w-3/4" />
                      <div className="h-3 bg-sage-100 dark:bg-sage-700 rounded w-1/2" />
                    </div>
                  </div>

                  {/* Garden Preview */}
                  <div className="card bg-linear-to-br from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-sm">
                          psychiatry
                        </span>
                      </div>
                      <span className="font-medium text-sage-700 dark:text-sage-300">
                        Garden
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <div className="text-6xl">🌱</div>
                    </div>
                  </div>

                  {/* Video Call Preview */}
                  <div className="card bg-sage-800 p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 rounded-full bg-coral-500/20 flex items-center justify-center">
                        <span className="material-symbols-rounded text-coral-400 text-sm">
                          videocam
                        </span>
                      </div>
                      <span className="font-medium text-white">Video Visit</span>
                    </div>
                    <div className="h-24 bg-sage-700 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-rounded text-sage-400 text-4xl">
                        person
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-sage-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-sage-900 dark:text-white mb-4">
              Everything you need in one place
            </h2>
            <p className="text-lg text-sage-600 dark:text-sage-400 max-w-2xl mx-auto">
              Designed with calm technology principles for neurodivergent-friendly
              experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-glass p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
                <span className="material-symbols-rounded text-white text-2xl">
                  groups
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                Care Team Coordination
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                Connect all professionals involved in your child&apos;s care with
                secure messaging and shared notes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-glass p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-lavender-400 to-lavender-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-white text-2xl">
                  description
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                SOAP Notes
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                Clinical documentation with structured SOAP format for healthcare
                professionals.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-glass p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-coral-400 to-coral-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-white text-2xl">
                  videocam
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                Video Consultations
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                HIPAA-compliant video visits with your care team from anywhere.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card-glass p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-sage-400 to-sage-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-white text-2xl">
                  psychiatry
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                Interactive Garden
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                Engaging activities for children with progress tracking and
                rewards.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card-glass p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-white text-2xl">
                  security
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                HIPAA Compliant
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                Enterprise-grade security with end-to-end encryption and audit
                logging.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card-glass p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary-400 to-lavender-500 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-rounded text-white text-2xl">
                  accessibility_new
                </span>
              </div>
              <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                Neurodivergent-Friendly
              </h3>
              <p className="text-sage-600 dark:text-sage-400">
                Calm, predictable design with reduced motion and sensory-friendly
                interfaces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-sage-900 dark:text-white mb-4">
              Getting started is easy
            </h2>
            <p className="text-lg text-sage-600 dark:text-sage-400 max-w-2xl mx-auto">
              Set up your care coordination hub in just a few minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-6xl font-bold text-primary-100 dark:text-primary-900/30 absolute -top-4 -left-2">
                1
              </div>
              <div className="relative pt-8 pl-4">
                <h3 className="text-xl font-semibold text-sage-900 dark:text-white mb-2">
                  Create your account
                </h3>
                <p className="text-sage-600 dark:text-sage-400">
                  Sign up as a parent, clinician, or support professional. Add your
                  child&apos;s profile.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-6xl font-bold text-primary-100 dark:text-primary-900/30 absolute -top-4 -left-2">
                2
              </div>
              <div className="relative pt-8 pl-4">
                <h3 className="text-xl font-semibold text-sage-900 dark:text-white mb-2">
                  Invite your care team
                </h3>
                <p className="text-sage-600 dark:text-sage-400">
                  Send secure invitations to doctors, therapists, and support
                  specialists.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-6xl font-bold text-primary-100 dark:text-primary-900/30 absolute -top-4 -left-2">
                3
              </div>
              <div className="relative pt-8 pl-4">
                <h3 className="text-xl font-semibold text-sage-900 dark:text-white mb-2">
                  Start coordinating
                </h3>
                <p className="text-sage-600 dark:text-sage-400">
                  Message your team, schedule video visits, and track progress
                  together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-sage-900 dark:bg-sage-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Your family&apos;s privacy is our priority
              </h2>
              <p className="text-lg text-sage-300 mb-8">
                AutiCare is built from the ground up with security and privacy at
                its core. We exceed healthcare industry standards to protect your
                most sensitive information.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="material-symbols-rounded text-primary-400 mr-3 mt-0.5">
                    check_circle
                  </span>
                  <span className="text-sage-300">
                    HIPAA compliant infrastructure and processes
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-rounded text-primary-400 mr-3 mt-0.5">
                    check_circle
                  </span>
                  <span className="text-sage-300">
                    End-to-end encryption for all communications
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-rounded text-primary-400 mr-3 mt-0.5">
                    check_circle
                  </span>
                  <span className="text-sage-300">
                    Comprehensive audit logging for compliance
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-rounded text-primary-400 mr-3 mt-0.5">
                    check_circle
                  </span>
                  <span className="text-sage-300">
                    Role-based access control for data protection
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 rounded-full bg-linear-to-br from-primary-500/20 to-teal-500/20 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-linear-to-br from-primary-500/30 to-teal-500/30 flex items-center justify-center">
                  <span className="material-symbols-rounded text-primary-400 text-7xl">
                    verified_user
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-sage-900 dark:text-white mb-6">
            Ready to simplify your child&apos;s care coordination?
          </h2>
          <p className="text-lg text-sage-600 dark:text-sage-400 mb-8">
            Join families who are already using AutiCare to connect their care
            teams and track progress.
          </p>
          <Link href="/register" className="btn-primary text-lg px-8 py-4">
            <span className="material-symbols-rounded mr-2">rocket_launch</span>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-sage-200 dark:border-sage-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img src="/logo.jpeg" alt="AutiCare" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-semibold text-sage-900 dark:text-white">
                AutiCare
              </span>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-sage-500 dark:text-sage-500">
            © {new Date().getFullYear()} AutiCare. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
