"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AccessibilitySettingsPage() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [largeButtons, setLargeButtons] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load preferences
    const savedReducedMotion = localStorage.getItem("reducedMotion") === "true";
    const savedHighContrast = localStorage.getItem("highContrast") === "true";
    const savedLargeButtons = localStorage.getItem("largeButtons") === "true";
    const savedScreenReader = localStorage.getItem("screenReader") === "true";

    setReducedMotion(savedReducedMotion);
    setHighContrast(savedHighContrast);
    setLargeButtons(savedLargeButtons);
    setScreenReader(savedScreenReader);

    // Check system preference for reduced motion
    if (!localStorage.getItem("reducedMotion")) {
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    }
  }, []);

  const handleToggle = (
    setting: string,
    value: boolean,
    setter: (value: boolean) => void
  ) => {
    setter(value);
    localStorage.setItem(setting, String(value));

    // Apply settings
    if (setting === "reducedMotion") {
      if (value) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    }
    if (setting === "highContrast") {
      if (value) {
        document.documentElement.classList.add("high-contrast");
      } else {
        document.documentElement.classList.remove("high-contrast");
      }
    }
    if (setting === "largeButtons") {
      if (value) {
        document.documentElement.classList.add("large-targets");
      } else {
        document.documentElement.classList.remove("large-targets");
      }
    }

    showSuccess();
  };

  const showSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const settings = [
    {
      key: "reducedMotion",
      label: "Reduce Motion",
      description:
        "Minimize animations and transitions throughout the app. Recommended for users sensitive to motion.",
      icon: "animation",
      value: reducedMotion,
      setter: setReducedMotion,
    },
    {
      key: "highContrast",
      label: "High Contrast",
      description:
        "Increase contrast between text and backgrounds for better readability.",
      icon: "contrast",
      value: highContrast,
      setter: setHighContrast,
    },
    {
      key: "largeButtons",
      label: "Large Touch Targets",
      description:
        "Make buttons and interactive elements larger for easier tapping.",
      icon: "touch_app",
      value: largeButtons,
      setter: setLargeButtons,
    },
    {
      key: "screenReader",
      label: "Screen Reader Optimized",
      description:
        "Optimize the interface for screen reader compatibility with enhanced labels.",
      icon: "hearing",
      value: screenReader,
      setter: setScreenReader,
    },
  ];

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
            Accessibility
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Customize accessibility features
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
          <span className="material-symbols-rounded mr-2 align-middle">
            check_circle
          </span>
          Accessibility setting updated!
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-200 dark:border-lavender-800">
        <div className="flex items-start">
          <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400 mr-3 mt-0.5">
            info
          </span>
          <div>
            <p className="font-medium text-lavender-800 dark:text-lavender-200">
              Designed for Neurodiversity
            </p>
            <p className="text-sm text-lavender-700 dark:text-lavender-300 mt-1">
              AutiCare is built with neurodivergent users in mind. These
              settings allow you to customize the experience to your needs.
            </p>
          </div>
        </div>
      </div>

      {/* Accessibility Settings */}
      <div className="card divide-y divide-sage-100 dark:divide-sage-800">
        {settings.map((setting) => (
          <div key={setting.key} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                    {setting.icon}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sage-900 dark:text-white">
                    {setting.label}
                  </p>
                  <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">
                    {setting.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleToggle(setting.key, !setting.value, setting.setter)
                }
                className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ml-4 ${
                  setting.value
                    ? "bg-primary-500"
                    : "bg-sage-200 dark:bg-sage-700"
                }`}
                aria-label={`Toggle ${setting.label}`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow ${
                    setting.value ? "left-7" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
          Need More Help?
        </h3>
        <p className="text-sage-600 dark:text-sage-400 mb-4">
          If you need additional accessibility accommodations or have feedback
          on how we can improve, please contact our support team.
        </p>
        <Link href="/help" className="btn-secondary inline-flex">
          <span className="material-symbols-rounded mr-2">support</span>
          Contact Support
        </Link>
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
