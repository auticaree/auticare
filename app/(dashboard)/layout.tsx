"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: "home", label: "Home" },
  { href: "/messages", icon: "chat", label: "Messages" },
  { href: "/video", icon: "videocam", label: "Visits" },
  { href: "/garden", icon: "psychiatry", label: "Garden", roles: ["CHILD", "PARENT"] },
  { href: "/notes", icon: "description", label: "Notes", roles: ["CLINICIAN", "SUPPORT"] },
  { href: "/children", icon: "child_care", label: "Children", roles: ["PARENT"] },
  { href: "/patients", icon: "group", label: "Patients", roles: ["CLINICIAN", "SUPPORT"] },
  { href: "/guidance", icon: "lightbulb", label: "Guidance", roles: ["PARENT"] },
  { href: "/community", icon: "diversity_3", label: "Community", roles: ["PARENT"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return userRole && item.roles.includes(userRole);
  });

  // Get main nav items (max 5 for mobile)
  const mainNavItems = visibleNavItems.slice(0, 5);

  return (
    <div className="min-h-screen bg-sage-50 dark:bg-sage-950">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-sage-900/80 border-b border-sage-200/50 dark:border-sage-700/50 safe-area-top">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-glow">
              <img src="/logo.jpeg" alt="AutiCare" className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-semibold text-sage-900 dark:text-white hidden sm:block">
              AutiCare
            </span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors">
              <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                notifications
              </span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-coral-500 rounded-full" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary-400 to-teal-500 flex items-center justify-center text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
                <span className="material-symbols-rounded text-sage-400 text-sm">
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white dark:bg-sage-800 rounded-xl shadow-soft border border-sage-200 dark:border-sage-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="px-4 py-2 border-b border-sage-100 dark:border-sage-700">
                  <p className="font-medium text-sage-900 dark:text-white">
                    {session?.user?.name}
                  </p>
                  <p className="text-sm text-sage-500 dark:text-sage-400">
                    {session?.user?.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {userRole}
                  </span>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-sage-700"
                >
                  <span className="material-symbols-rounded mr-3 text-sage-400">
                    settings
                  </span>
                  Settings
                </Link>
                <Link
                  href="/help"
                  className="flex items-center px-4 py-2 text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-sage-700"
                >
                  <span className="material-symbols-rounded mr-3 text-sage-400">
                    help
                  </span>
                  Help & Support
                </Link>
                <hr className="my-2 border-sage-100 dark:border-sage-700" />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center px-4 py-2 text-coral-600 dark:text-coral-400 hover:bg-coral-50 dark:hover:bg-coral-900/20"
                >
                  <span className="material-symbols-rounded mr-3">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-sage-900/90 border-t border-sage-200/50 dark:border-sage-700/50 safe-area-bottom md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
                    : "text-sage-500 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300"
                }`}
              >
                <span
                  className={`material-symbols-rounded text-2xl ${
                    isActive ? "font-bold" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block fixed left-0 top-16 bottom-0 w-64 border-r border-sage-200 dark:border-sage-800 bg-white/50 dark:bg-sage-900/50 backdrop-blur-xl">
        <div className="p-4 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                    : "text-sage-600 dark:text-sage-400 hover:bg-sage-100 dark:hover:bg-sage-800"
                }`}
              >
                <span className="material-symbols-rounded mr-3">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-4 rounded-xl bg-linear-to-br from-primary-50 to-teal-50 dark:from-primary-900/20 dark:to-teal-900/20 border border-primary-200/50 dark:border-primary-700/50">
            <p className="text-sm font-medium text-sage-700 dark:text-sage-300 mb-2">
              Need help?
            </p>
            <p className="text-xs text-sage-500 dark:text-sage-400 mb-3">
              Our support team is here to assist you.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <span className="material-symbols-rounded mr-1 text-sm">
                support_agent
              </span>
              Get Support
            </Link>
          </div>
        </div>
      </aside>

      {/* Desktop Content Offset */}
      <style jsx global>{`
        @media (min-width: 768px) {
          main {
            margin-left: 16rem;
          }
        }
      `}</style>
    </div>
  );
}
