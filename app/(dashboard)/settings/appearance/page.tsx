"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "larger">("normal");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedTheme = localStorage.getItem("theme") as typeof theme;
    const savedFontSize = localStorage.getItem("fontSize") as typeof fontSize;
    if (savedTheme) setTheme(savedTheme);
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Apply theme
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    showSuccess();
  };

  const handleFontSizeChange = (newSize: typeof fontSize) => {
    setFontSize(newSize);
    localStorage.setItem("fontSize", newSize);

    // Apply font size
    document.documentElement.classList.remove("text-base", "text-lg", "text-xl");
    if (newSize === "large") {
      document.documentElement.style.fontSize = "18px";
    } else if (newSize === "larger") {
      document.documentElement.style.fontSize = "20px";
    } else {
      document.documentElement.style.fontSize = "16px";
    }
    showSuccess();
  };

  const showSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const themes = [
    { value: "light", label: "Light", icon: "light_mode" },
    { value: "dark", label: "Dark", icon: "dark_mode" },
    { value: "system", label: "System", icon: "settings_brightness" },
  ] as const;

  const fontSizes = [
    { value: "normal", label: "Normal", preview: "Aa" },
    { value: "large", label: "Large", preview: "Aa" },
    { value: "larger", label: "Larger", preview: "Aa" },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/settings"
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Appearance
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Customize how AutiCare looks
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
          <span className="material-symbols-rounded mr-2 align-middle">
            check_circle
          </span>
          Appearance updated!
        </div>
      )}

      {/* Theme Selection */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
          Theme
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => handleThemeChange(t.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                theme === t.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-sage-200 dark:border-sage-700 hover:border-sage-300 dark:hover:border-sage-600"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  t.value === "light"
                    ? "bg-amber-100"
                    : t.value === "dark"
                    ? "bg-slate-800"
                    : "bg-linear-to-br from-amber-100 to-slate-800"
                }`}
              >
                <span
                  className={`material-symbols-rounded ${
                    t.value === "light"
                      ? "text-amber-500"
                      : t.value === "dark"
                      ? "text-slate-300"
                      : "text-sage-600"
                  }`}
                >
                  {t.icon}
                </span>
              </div>
              <p className="font-medium text-sage-900 dark:text-white text-center">
                {t.label}
              </p>
              {theme === t.value && (
                <span className="material-symbols-rounded text-primary-500 block text-center mt-2">
                  check_circle
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
          Text Size
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {fontSizes.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFontSizeChange(f.value)}
              className={`p-4 rounded-xl border-2 transition-all ${
                fontSize === f.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-sage-200 dark:border-sage-700 hover:border-sage-300 dark:hover:border-sage-600"
              }`}
            >
              <div
                className={`mx-auto mb-3 font-bold text-sage-900 dark:text-white ${
                  f.value === "normal"
                    ? "text-2xl"
                    : f.value === "large"
                    ? "text-3xl"
                    : "text-4xl"
                }`}
              >
                {f.preview}
              </div>
              <p className="font-medium text-sage-900 dark:text-white text-center">
                {f.label}
              </p>
              {fontSize === f.value && (
                <span className="material-symbols-rounded text-primary-500 block text-center mt-2">
                  check_circle
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color Options (Future) */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-sage-900 dark:text-white">
              Accent Color
            </h3>
            <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">
              Customize the primary color throughout the app
            </p>
          </div>
          <span className="badge bg-sage-100 dark:bg-sage-800 text-sage-600 dark:text-sage-400">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex items-center justify-end">
        <Link href="/settings" className="btn-secondary">
          Back to Settings
        </Link>
      </div>
    </div>
  );
}
