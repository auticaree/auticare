"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExportDataPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExporting(false);
    setExportComplete(true);
  };

  const exportOptions = [
    {
      id: "profile",
      label: "Profile Information",
      description: "Your account details and preferences",
      icon: "person",
    },
    {
      id: "children",
      label: "Children Data",
      description: "All child profiles and their information",
      icon: "child_care",
    },
    {
      id: "notes",
      label: "Clinical Notes",
      description: "All medical and support notes",
      icon: "description",
    },
    {
      id: "messages",
      label: "Messages",
      description: "All message threads and conversations",
      icon: "chat",
    },
    {
      id: "visits",
      label: "Video Visits",
      description: "Video consultation history",
      icon: "videocam",
    },
    {
      id: "garden",
      label: "Garden Progress",
      description: "Child garden data and achievements",
      icon: "eco",
    },
  ];

  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    exportOptions.map((o) => o.id)
  );

  const toggleOption = (id: string) => {
    setSelectedOptions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
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
            Export Data
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Download a copy of your data
          </p>
        </div>
      </div>

      {exportComplete ? (
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-primary-600 dark:text-primary-400 text-3xl">
              check_circle
            </span>
          </div>
          <h3 className="text-xl font-semibold text-sage-900 dark:text-white mb-2">
            Export Complete!
          </h3>
          <p className="text-sage-600 dark:text-sage-400 mb-6">
            Your data export has been prepared. You will receive an email with a
            download link shortly.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setExportComplete(false)}
              className="btn-secondary"
            >
              Export More Data
            </button>
            <Link href="/settings" className="btn-primary">
              Back to Settings
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Info */}
          <div className="p-4 rounded-xl bg-lavender-50 dark:bg-lavender-900/20 border border-lavender-200 dark:border-lavender-800">
            <div className="flex items-start">
              <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400 mr-3 mt-0.5">
                info
              </span>
              <div>
                <p className="font-medium text-lavender-800 dark:text-lavender-200">
                  Data Portability
                </p>
                <p className="text-sm text-lavender-700 dark:text-lavender-300 mt-1">
                  Export your data in a machine-readable format. The export will
                  be sent to your registered email address as a secure ZIP file.
                </p>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
              Select Data to Export
            </h3>
            <div className="space-y-3">
              {exportOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all ${
                    selectedOptions.includes(option.id)
                      ? "bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500"
                      : "bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option.id)}
                    onChange={() => toggleOption(option.id)}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-sage-900 flex items-center justify-center mr-3 flex-shrink-0">
                    <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                      {option.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sage-900 dark:text-white">
                      {option.label}
                    </p>
                    <p className="text-sm text-sage-500">{option.description}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedOptions.includes(option.id)
                        ? "border-primary-500 bg-primary-500"
                        : "border-sage-300 dark:border-sage-600"
                    }`}
                  >
                    {selectedOptions.includes(option.id) && (
                      <span className="material-symbols-rounded text-white text-sm">
                        check
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Select All / None */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedOptions(exportOptions.map((o) => o.id))}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Select All
            </button>
            <span className="text-sage-300">|</span>
            <button
              onClick={() => setSelectedOptions([])}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              Select None
            </button>
          </div>

          {/* Export Format */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-4">
              Export Format
            </h3>
            <div className="p-4 bg-sage-50 dark:bg-sage-800 rounded-xl">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                  folder_zip
                </span>
                <div>
                  <p className="font-medium text-sage-900 dark:text-white">
                    ZIP Archive (JSON)
                  </p>
                  <p className="text-sm text-sage-500">
                    Human and machine-readable format
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3">
            <Link href="/settings" className="btn-secondary">
              Cancel
            </Link>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedOptions.length === 0}
              className="btn-primary"
            >
              {isExporting ? (
                <>
                  <span className="material-symbols-rounded animate-spin mr-2">
                    progress_activity
                  </span>
                  Preparing Export...
                </>
              ) : (
                <>
                  <span className="material-symbols-rounded mr-2">download</span>
                  Export Selected Data
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
