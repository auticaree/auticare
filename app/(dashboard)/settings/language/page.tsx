"use client";

import { useState } from "react";
import Link from "next/link";

export default function LanguageSettingsPage() {
  const [language, setLanguage] = useState("en-US");
  const [success, setSuccess] = useState(false);

  const languages = [
    { code: "en-US", name: "English (US)", flag: "🇺🇸" },
    { code: "en-GB", name: "English (UK)", flag: "🇬🇧", disabled: true },
    { code: "es", name: "Español", flag: "🇪🇸", disabled: true },
    { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷", disabled: true },
    { code: "fr", name: "Français", flag: "🇫🇷", disabled: true },
    { code: "de", name: "Deutsch", flag: "🇩🇪", disabled: true },
  ];

  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

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
            Language
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Choose your preferred language
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
          <span className="material-symbols-rounded mr-2 align-middle">
            check_circle
          </span>
          Language preference saved!
        </div>
      )}

      {/* Pilot Notice */}
      <div className="p-4 rounded-xl bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-200 dark:border-lavender-800">
        <div className="flex items-start">
          <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400 mr-3 mt-0.5">
            info
          </span>
          <div>
            <p className="font-medium text-lavender-800 dark:text-lavender-200">
              Pilot Version
            </p>
            <p className="text-sm text-lavender-700 dark:text-lavender-300 mt-1">
              The pilot version of AutiCare is available in English (US) only.
              Additional languages will be added in future releases.
            </p>
          </div>
        </div>
      </div>

      {/* Language Selection */}
      <div className="card divide-y divide-sage-100 dark:divide-sage-800">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => !lang.disabled && handleLanguageChange(lang.code)}
            disabled={lang.disabled}
            className={`w-full p-4 flex items-center justify-between transition-colors ${
              lang.disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-sage-50 dark:hover:bg-sage-800/50"
            } ${language === lang.code ? "bg-primary-50 dark:bg-primary-900/20" : ""}`}
          >
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-sage-900 dark:text-white">
                {lang.name}
              </span>
              {lang.disabled && (
                <span className="badge bg-sage-100 dark:bg-sage-800 text-sage-600 dark:text-sage-400 text-xs">
                  Coming Soon
                </span>
              )}
            </div>
            {language === lang.code && (
              <span className="material-symbols-rounded text-primary-500">
                check_circle
              </span>
            )}
          </button>
        ))}
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
