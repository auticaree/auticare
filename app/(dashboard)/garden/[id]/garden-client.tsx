"use client";

import { useState } from "react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  experienceReward: number;
  category: string;
}

interface CompletedTask {
  id: string;
  title: string;
  completedAt: string;
}

interface GardenClientProps {
  child: {
    id: string;
    name: string;
    preferredName: string | null;
  };
  garden: {
    id: string;
    level: number;
    experience: number;
    currentPlant: string;
    plantsGrown: number;
    lastWatered: Date | null;
  };
  growthPercentage: number;
  plantPhase: string;
  pendingTasks: Task[];
  completedTasks: CompletedTask[];
  isChildMode: boolean;
  isParent: boolean;
}

export default function GardenClient({
  child,
  garden,
  growthPercentage,
  plantPhase,
  pendingTasks,
  completedTasks,
  isChildMode,
  isParent,
}: GardenClientProps) {
  const [currentView, setCurrentView] = useState<"garden" | "tasks" | "settings">("garden");
  const [isWatering, setIsWatering] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [localExperience, setLocalExperience] = useState(garden.experience);
  const [localGrowthPercentage, setLocalGrowthPercentage] = useState(growthPercentage);
  const [showCelebration, setShowCelebration] = useState(false);

  const displayName = child.preferredName || child.name.split(" ")[0];

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleWater = async () => {
    setIsWatering(true);
    try {
      const response = await fetch(`/api/garden/${garden.id}/water`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setLocalExperience(data.experience);
        setLocalGrowthPercentage(data.growthPercentage);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
    } catch (error) {
      console.error("Error watering:", error);
    } finally {
      setIsWatering(false);
    }
  };

  const handleCompleteTask = async (taskId: string, expReward: number) => {
    setCompletingTaskId(taskId);
    try {
      const response = await fetch(`/api/garden/${garden.id}/tasks/${taskId}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setLocalExperience(data.experience);
        setLocalGrowthPercentage(data.growthPercentage);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
        // Remove task from pending list in UI
        window.location.reload();
      }
    } catch (error) {
      console.error("Error completing task:", error);
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Calculate tasks until level up
  const expForNextLevel = garden.level * 100;
  const expRemaining = expForNextLevel - localExperience;
  const avgTaskExp = 15;
  const tasksUntilLevelUp = Math.ceil(expRemaining / avgTaskExp);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      hygiene: "dentistry",
      routine: "schedule",
      social: "group",
      learning: "school",
      activity: "sports_soccer",
      calm: "self_improvement",
    };
    return icons[category] || "check_circle";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      hygiene: "purple",
      routine: "blue",
      social: "pink",
      learning: "amber",
      activity: "green",
      calm: "teal",
    };
    return colors[category] || "sage";
  };

  return (
    <div className={`relative flex min-h-screen w-full flex-col overflow-hidden ${isChildMode ? "" : "pb-0"}`}>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-sage-800 rounded-3xl p-8 shadow-2xl text-center transform animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-sage-900 dark:text-white">
              Great job!
            </h3>
            <p className="text-primary-500 font-medium">Your plant is growing!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4 sticky top-0 z-10 bg-background-light dark:bg-background-dark">
        <div className="flex flex-col">
          <span className="text-sage-500 dark:text-sage-400 text-sm font-medium">
            {getGreeting()},
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-sage-900 dark:text-white">
            {displayName}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          {!isChildMode && (
            <Link
              href={`/children/${child.id}`}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-sage-800 shadow-sm border border-sage-100 dark:border-white/5"
            >
              <span className="material-symbols-rounded text-sage-500">arrow_back</span>
            </Link>
          )}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-sage-800 shadow-sm border border-sage-100 dark:border-white/5">
            <span className="material-symbols-rounded text-amber-400 text-3xl">wb_sunny</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-32">
        {currentView === "garden" && (
          <>
            {/* Garden Card */}
            <div className="mt-2 w-full">
              <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-sage-800 p-6 shadow-sm ring-1 ring-sage-900/5 dark:ring-white/10 transition-all">
                {/* Background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

                {/* Plant Image */}
                <div className="relative z-10 w-full aspect-square max-w-70 flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-500">
                  <div className={`text-[150px] ${isWatering ? "animate-bounce" : ""}`}>
                    {localGrowthPercentage < 25 && "🌱"}
                    {localGrowthPercentage >= 25 && localGrowthPercentage < 50 && "🌿"}
                    {localGrowthPercentage >= 50 && localGrowthPercentage < 75 && "🌻"}
                    {localGrowthPercentage >= 75 && localGrowthPercentage < 100 && "🌺"}
                    {localGrowthPercentage >= 100 && "🌳"}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1 z-10">
                  <h2 className="text-2xl font-bold text-sage-900 dark:text-white">
                    Your Plant
                  </h2>
                  <p className="text-primary-500 font-medium text-lg">{plantPhase}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="badge badge-primary">Level {garden.level}</span>
                    <span className="badge badge-sage">{garden.plantsGrown} plants grown</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 px-2">
              <div className="flex justify-between items-end mb-3">
                <span className="text-base font-medium text-sage-700 dark:text-sage-200">
                  Growth Progress
                </span>
                <span className="text-sm font-medium text-primary-500">{localGrowthPercentage}%</span>
              </div>
              <div className="h-4 w-full bg-sage-200 dark:bg-sage-700/50 rounded-full overflow-hidden p-1">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${localGrowthPercentage}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-full bg-linear-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              </div>
              <p className="mt-3 text-sm text-sage-500 dark:text-sage-400 text-center">
                Complete {tasksUntilLevelUp} more task{tasksUntilLevelUp !== 1 ? "s" : ""} to level up!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={handleWater}
                disabled={isWatering}
                className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl bg-primary-500 p-6 shadow-lg shadow-primary-500/20 active:scale-95 transition-all duration-200 disabled:opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white group-hover:bg-white/30 transition-colors">
                  <span className="material-symbols-rounded text-3xl">water_drop</span>
                </div>
                <span className="font-bold text-white text-lg">
                  {isWatering ? "Watering..." : "Water"}
                </span>
              </button>

              <button
                onClick={() => setCurrentView("tasks")}
                className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl bg-white dark:bg-sage-800 border-2 border-sage-100 dark:border-sage-700 p-6 active:scale-95 transition-all duration-200"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-500">
                  <span className="material-symbols-rounded text-3xl">task_alt</span>
                </div>
                <span className="font-bold text-sage-700 dark:text-sage-300 text-lg">
                  Tasks ({pendingTasks.length})
                </span>
              </button>
            </div>

            {/* Games Section */}
            <div className="mt-6">
              <Link
                href={`/garden/${child.id}/games`}
                className="card p-5 flex items-center gap-4 hover:bg-sage-50 dark:hover:bg-sage-800/50 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-lavender-100 dark:bg-lavender-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎴</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sage-900 dark:text-white">
                    Play Games
                  </h3>
                  <p className="text-sm text-sage-600 dark:text-sage-400">
                    Earn XP with fun matching games!
                  </p>
                </div>
                <span className="material-symbols-rounded text-sage-400 group-hover:text-primary-500 transition-colors">
                  chevron_right
                </span>
              </Link>
            </div>

            {/* Next Task CTA */}
            {pendingTasks.length > 0 && (
              <div className="mt-6 mb-4">
                <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-sage-800 p-5 shadow-sm border border-sage-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-${getCategoryColor(pendingTasks[0].category)}-100 dark:bg-${getCategoryColor(pendingTasks[0].category)}-900/30 text-${getCategoryColor(pendingTasks[0].category)}-600 dark:text-${getCategoryColor(pendingTasks[0].category)}-300`}>
                      <span className="material-symbols-rounded text-2xl">
                        {pendingTasks[0].icon || getCategoryIcon(pendingTasks[0].category)}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-sage-400">
                        Up Next
                      </span>
                      <span className="text-lg font-bold text-sage-900 dark:text-white">
                        {pendingTasks[0].title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCompleteTask(pendingTasks[0].id, pendingTasks[0].experienceReward)}
                      disabled={completingTaskId === pendingTasks[0].id}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 dark:bg-sage-700 text-sage-600 dark:text-sage-300 hover:bg-primary-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-rounded">
                        {completingTaskId === pendingTasks[0].id ? "progress_activity" : "check"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentView === "tasks" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-sage-900 dark:text-white">
                My Tasks
              </h2>
              {isParent && (
                <Link
                  href={`/garden/${child.id}/add-task`}
                  className="btn-primary"
                >
                  <span className="material-symbols-rounded mr-2">add</span>
                  Add Task
                </Link>
              )}
            </div>

            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="card p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${getCategoryColor(task.category)}-100 dark:bg-${getCategoryColor(task.category)}-900/30`}>
                        <span className={`material-symbols-rounded text-${getCategoryColor(task.category)}-600 dark:text-${getCategoryColor(task.category)}-400`}>
                          {task.icon || getCategoryIcon(task.category)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sage-900 dark:text-white">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-sage-500 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <span className="text-xs text-primary-500">
                          +{task.experienceReward} XP
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteTask(task.id, task.experienceReward)}
                      disabled={completingTaskId === task.id}
                      className="w-10 h-10 rounded-full bg-sage-100 dark:bg-sage-700 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-rounded">
                        {completingTaskId === task.id ? "progress_activity" : "check"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center">
                <span className="text-6xl mb-4">🎉</span>
                <h3 className="text-lg font-semibold text-sage-900 dark:text-white">
                  All done for now!
                </h3>
                <p className="text-sage-500 mt-2">
                  Great job completing your tasks!
                </p>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-3">
                  Recently Completed
                </h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-sage-50 dark:bg-sage-800/50 opacity-70"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="material-symbols-rounded text-teal-500">
                          check_circle
                        </span>
                        <span className="text-sage-700 dark:text-sage-300 line-through">
                          {task.title}
                        </span>
                      </div>
                      <span className="text-xs text-sage-400">
                        {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {currentView === "settings" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-sage-900 dark:text-white mb-4">
              Garden Settings
            </h2>
            <div className="card p-4">
              <p className="text-sage-600 dark:text-sage-400">
                Settings coming soon...
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Child Mode) */}
      {isChildMode && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#152724]/90 backdrop-blur-md border-t border-sage-100 dark:border-white/5 pb-6 pt-2 z-50">
          <div className="flex items-center justify-around w-full max-w-md mx-auto px-4">
            <button
              onClick={() => setCurrentView("garden")}
              className={`flex flex-col items-center justify-center gap-1 p-2 w-20 ${currentView === "garden"
                  ? "text-primary-500"
                  : "text-sage-400 dark:text-sage-500"
                }`}
            >
              <div className="relative">
                <span className="material-symbols-rounded text-[28px]">potted_plant</span>
                {currentView === "garden" && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"></span>
                )}
              </div>
              <span className="text-xs font-semibold">Garden</span>
            </button>

            <button
              onClick={() => setCurrentView("tasks")}
              className={`flex flex-col items-center justify-center gap-1 p-2 w-20 ${currentView === "tasks"
                  ? "text-primary-500"
                  : "text-sage-400 dark:text-sage-500"
                }`}
            >
              <span className="material-symbols-rounded text-[28px]">check_circle</span>
              <span className="text-xs font-medium">My Tasks</span>
            </button>

            <button
              onClick={() => setCurrentView("settings")}
              className={`flex flex-col items-center justify-center gap-1 p-2 w-20 ${currentView === "settings"
                  ? "text-primary-500"
                  : "text-sage-400 dark:text-sage-500"
                }`}
            >
              <span className="material-symbols-rounded text-[28px]">settings</span>
              <span className="text-xs font-medium">Settings</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
