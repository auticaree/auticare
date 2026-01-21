"use client";

import { useState } from "react";
import Link from "next/link";

export default function PrivacySettingsPage() {
  const [shareAnalytics, setShareAnalytics] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [success, setSuccess] = useState(false);

  const handleToggle = (
    setter: (value: boolean) => void,
    currentValue: boolean
  ) => {
    setter(!currentValue);
    showSuccess();
  };

  const showSuccess = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const settings = [
    {
      key: "analytics",
      label: "Share Anonymous Analytics",
      description:
        "Help improve AutiCare by sharing anonymous usage data. No personal information is collected.",
      value: shareAnalytics,
      setter: setShareAnalytics,
    },
    {
      key: "online",
      label: "Show Online Status",
      description:
        "Let care team members see when you're active on AutiCare.",
      value: showOnlineStatus,
      setter: setShowOnlineStatus,
    },
    {
      key: "messages",
      label: "Allow Direct Messages",
      description:
        "Allow care team members to send you direct messages.",
      value: allowMessages,
      setter: setAllowMessages,
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
            Privacy
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Manage your privacy settings
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
          <span className="material-symbols-rounded mr-2 align-middle">
            check_circle
          </span>
          Privacy setting updated!
        </div>
      )}

      {/* Privacy Settings */}
      <div className="card divide-y divide-sage-100 dark:divide-sage-800">
        {settings.map((setting) => (
          <div key={setting.key} className="p-6">
            <div className="flex items-start justify-between">
              <div className="pr-4">
                <p className="font-medium text-sage-900 dark:text-white">
                  {setting.label}
                </p>
                <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">
                  {setting.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(setting.setter, setting.value)}
                className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ${
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

      {/* Data Protection Info */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
          Your Data Protection Rights
        </h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <span className="material-symbols-rounded text-primary-500 mt-0.5">
              check_circle
            </span>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Data Encryption
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                All your data is encrypted in transit and at rest
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="material-symbols-rounded text-primary-500 mt-0.5">
              check_circle
            </span>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Access Control
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                You control who can access your child&apos;s information
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="material-symbols-rounded text-primary-500 mt-0.5">
              check_circle
            </span>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Data Portability
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Export your data anytime from the Export Data settings
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="material-symbols-rounded text-primary-500 mt-0.5">
              check_circle
            </span>
            <div>
              <p className="font-medium text-sage-900 dark:text-white">
                Right to Deletion
              </p>
              <p className="text-sm text-sage-600 dark:text-sage-400">
                Request complete deletion of your account and data
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* HIPAA Notice */}
      <div className="card p-6 bg-teal-50 dark:bg-teal-900/10 border-teal-200 dark:border-teal-800/50">
        <div className="flex items-start space-x-3">
          <span className="material-symbols-rounded text-teal-600 dark:text-teal-400 text-2xl">
            verified_user
          </span>
          <div>
            <p className="font-medium text-teal-800 dark:text-teal-200">
              Healthcare Data Protection
            </p>
            <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
              AutiCare is designed with healthcare data protection in mind,
              following industry best practices for securing sensitive health
              information.
            </p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
          Learn More
        </h3>
        <div className="space-y-2">
          <Link
            href="/privacy"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 dark:hover:bg-sage-800 transition-colors"
          >
            <span className="text-sage-900 dark:text-white">Privacy Policy</span>
            <span className="material-symbols-rounded text-sage-400">
              chevron_right
            </span>
          </Link>
          <Link
            href="/terms"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 dark:hover:bg-sage-800 transition-colors"
          >
            <span className="text-sage-900 dark:text-white">Terms of Service</span>
            <span className="material-symbols-rounded text-sage-400">
              chevron_right
            </span>
          </Link>
          <Link
            href="/settings/export"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-sage-50 dark:hover:bg-sage-800 transition-colors"
          >
            <span className="text-sage-900 dark:text-white">Export Your Data</span>
            <span className="material-symbols-rounded text-sage-400">
              chevron_right
            </span>
          </Link>
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
