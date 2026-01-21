"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Child {
  id: string;
  name: string;
}

export default function AddGardenTaskPage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.id as string;

  const [child, setChild] = useState<Child | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(10);
  const [category, setCategory] = useState("therapy");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchChild() {
      try {
        const response = await fetch(`/api/children/${childId}`);
        if (response.ok) {
          const data = await response.json();
          setChild(data.child);
        }
      } catch {
        console.error("Error fetching child");
      } finally {
        setIsFetching(false);
      }
    }
    fetchChild();
  }, [childId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/garden/${childId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          xpReward,
          category,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create task");
        return;
      }

      router.push(`/garden/${childId}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: "therapy", label: "Therapy Activity", icon: "psychology" },
    { value: "exercise", label: "Exercise", icon: "fitness_center" },
    { value: "social", label: "Social Activity", icon: "groups" },
    { value: "learning", label: "Learning", icon: "school" },
    { value: "self-care", label: "Self Care", icon: "spa" },
    { value: "homework", label: "Homework", icon: "edit_note" },
  ];

  const xpOptions = [5, 10, 15, 20, 25, 50];

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <span className="material-symbols-rounded animate-spin text-3xl text-primary-500">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={`/garden/${childId}`}
          className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
            arrow_back
          </span>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
            Add Task
          </h1>
          <p className="text-sage-600 dark:text-sage-400">
            Create a new task for {child?.name || "this child"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-coral-50 dark:bg-coral-900/20 border border-coral-200 dark:border-coral-800 text-coral-700 dark:text-coral-300">
            <span className="material-symbols-rounded mr-2 align-middle">
              error
            </span>
            {error}
          </div>
        )}

        {/* Task Title */}
        <div className="card p-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
          >
            Task Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="e.g., Practice breathing exercises"
            required
          />
        </div>

        {/* Description */}
        <div className="card p-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field min-h-25 resize-none"
            placeholder="Add more details about this task..."
          />
        </div>

        {/* Category */}
        <div className="card p-4">
          <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                  category === cat.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-sage-200 dark:border-sage-700 hover:border-sage-300 dark:hover:border-sage-600"
                }`}
              >
                <span
                  className={`material-symbols-rounded text-2xl mb-1 ${
                    category === cat.value
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-sage-500"
                  }`}
                >
                  {cat.icon}
                </span>
                <span
                  className={`text-sm ${
                    category === cat.value
                      ? "text-primary-700 dark:text-primary-300 font-medium"
                      : "text-sage-600 dark:text-sage-400"
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* XP Reward */}
        <div className="card p-4">
          <label className="block text-sm font-medium text-sage-700 dark:text-sage-300 mb-3">
            XP Reward
          </label>
          <div className="flex flex-wrap gap-2">
            {xpOptions.map((xp) => (
              <button
                key={xp}
                type="button"
                onClick={() => setXpReward(xp)}
                className={`px-4 py-2 rounded-xl border-2 transition-all ${
                  xpReward === xp
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium"
                    : "border-sage-200 dark:border-sage-700 hover:border-sage-300 dark:hover:border-sage-600 text-sage-600 dark:text-sage-400"
                }`}
              >
                +{xp} XP
              </button>
            ))}
          </div>
          <p className="text-sm text-sage-500 mt-2">
            Higher XP for more challenging tasks encourages engagement
          </p>
        </div>

        {/* Preview */}
        <div className="card p-4 bg-sage-50 dark:bg-sage-800/50">
          <p className="text-sm font-medium text-sage-600 dark:text-sage-400 mb-2">
            Preview
          </p>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-sage-900 rounded-xl">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-rounded text-2xl text-sage-400">
                {categories.find((c) => c.value === category)?.icon || "task"}
              </span>
              <div>
                <p className="font-medium text-sage-900 dark:text-white">
                  {title || "Task Title"}
                </p>
                <p className="text-sm text-sage-500">
                  {categories.find((c) => c.value === category)?.label}
                </p>
              </div>
            </div>
            <span className="badge badge-primary">+{xpReward} XP</span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3">
          <Link href={`/garden/${childId}`} className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !title.trim()}
            className="btn-primary"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-rounded animate-spin mr-2">
                  progress_activity
                </span>
                Creating...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded mr-2">add</span>
                Create Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
