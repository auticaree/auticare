export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-sage-50 via-white to-primary-50 dark:from-sage-950 dark:via-sage-900 dark:to-primary-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-glow mb-4">
            <img src="/logo.jpeg" alt="AutiCare" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            AutiCare
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mt-1">
            Coordinated care for your child
          </p>
        </div>

        {/* Auth Card */}
        <div className="card-glass p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-sage-500 dark:text-sage-400 mt-6">
          Protected by HIPAA compliance standards
        </p>
      </div>
    </div>
  );
}
