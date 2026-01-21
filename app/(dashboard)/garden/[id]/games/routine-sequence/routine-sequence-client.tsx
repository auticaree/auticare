"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Routine Sequence Game - Client Component
 * Game 3 from Auti-2.md specification
 * 
 * Objective: Routine understanding and sequencing
 * Target audience: Children aged 3-8 years
 * Duration: 2-4 minutes
 * 
 * Routines:
 * - Morning routine
 * - Bedtime routine
 * - School preparation
 * 
 * Gameplay: Drag and drop cards to order daily activities
 */

interface RoutineSequenceClientProps {
  childId: string;
  childName: string;
}

type RoutineType = "morning" | "bedtime" | "school";

interface RoutineStep {
  id: string;
  name: string;
  icon: string;
  order: number;
}

const routines: Record<RoutineType, { name: string; emoji: string; color: string; steps: RoutineStep[] }> = {
  morning: {
    name: "Morning Routine",
    emoji: "🌅",
    color: "from-amber-400 to-orange-500",
    steps: [
      { id: "wake", name: "Wake up", icon: "🛏️", order: 1 },
      { id: "bathroom", name: "Use bathroom", icon: "🚽", order: 2 },
      { id: "brush", name: "Brush teeth", icon: "🪥", order: 3 },
      { id: "dress", name: "Get dressed", icon: "👕", order: 4 },
      { id: "breakfast", name: "Eat breakfast", icon: "🥣", order: 5 },
    ],
  },
  bedtime: {
    name: "Bedtime Routine",
    emoji: "🌙",
    color: "from-indigo-400 to-purple-500",
    steps: [
      { id: "pajamas", name: "Put on pajamas", icon: "🩳", order: 1 },
      { id: "teeth", name: "Brush teeth", icon: "🪥", order: 2 },
      { id: "story", name: "Story time", icon: "📖", order: 3 },
      { id: "hug", name: "Hug goodnight", icon: "🤗", order: 4 },
      { id: "sleep", name: "Go to sleep", icon: "😴", order: 5 },
    ],
  },
  school: {
    name: "School Prep",
    emoji: "🎒",
    color: "from-teal-400 to-cyan-500",
    steps: [
      { id: "backpack", name: "Pack backpack", icon: "🎒", order: 1 },
      { id: "homework", name: "Check homework", icon: "📝", order: 2 },
      { id: "shoes", name: "Put on shoes", icon: "👟", order: 3 },
      { id: "coat", name: "Grab coat", icon: "🧥", order: 4 },
      { id: "bye", name: "Say goodbye", icon: "👋", order: 5 },
    ],
  },
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function RoutineSequenceClient({ childId, childName }: RoutineSequenceClientProps) {
  const router = useRouter();

  // Game state
  const [gameState, setGameState] = useState<"intro" | "select" | "playing" | "checking" | "complete">("intro");
  const [routineType, setRoutineType] = useState<RoutineType>("morning");
  const [shuffledSteps, setShuffledSteps] = useState<RoutineStep[]>([]);
  const [orderedSteps, setOrderedSteps] = useState<RoutineStep[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedRoutines, setCompletedRoutines] = useState<RoutineType[]>([]);

  // Statistics
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start a routine
  const startRoutine = (type: RoutineType) => {
    setRoutineType(type);
    const steps = routines[type].steps;
    setShuffledSteps(shuffleArray([...steps]));
    setOrderedSteps([]);
    setIsCorrect(null);
    setGameState("playing");
    if (!startTime) {
      setStartTime(Date.now());
    }
  };

  // Handle card tap to add to sequence
  const handleCardTap = (step: RoutineStep) => {
    if (gameState !== "playing") return;
    
    // Remove from shuffled and add to ordered
    setShuffledSteps((prev) => prev.filter((s) => s.id !== step.id));
    setOrderedSteps((prev) => [...prev, step]);
  };

  // Handle removing from ordered sequence
  const handleRemoveFromOrder = (index: number) => {
    if (gameState !== "playing") return;
    
    const step = orderedSteps[index];
    setOrderedSteps((prev) => prev.filter((_, i) => i !== index));
    setShuffledSteps((prev) => [...prev, step]);
  };

  // Drag handlers for desktop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...orderedSteps];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setOrderedSteps(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Check sequence
  const checkSequence = () => {
    setAttempts((prev) => prev + 1);
    
    // Check if order matches
    const correct = orderedSteps.every((step, index) => step.order === index + 1);
    setIsCorrect(correct);
    
    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
      setCompletedRoutines((prev) => [...prev, routineType]);
    }
    
    setGameState("checking");
  };

  // Continue to next routine or complete
  const continueGame = () => {
    const allTypes: RoutineType[] = ["morning", "bedtime", "school"];
    const remaining = allTypes.filter((t) => !completedRoutines.includes(t) && t !== routineType);
    
    if (remaining.length === 0 || (isCorrect && completedRoutines.length >= 2)) {
      // All routines done or 3 completed
      setGameState("complete");
    } else if (isCorrect) {
      // Show select screen for next routine
      setGameState("select");
    } else {
      // Retry same routine
      startRoutine(routineType);
    }
  };

  // Save session
  const saveSession = async () => {
    if (isSubmitting || !startTime) return;

    setIsSubmitting(true);
    const duration = Math.round((Date.now() - startTime) / 1000);

    try {
      await fetch(`/api/children/${childId}/games`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "ROUTINE_SEQUENCE",
          attempts,
          correctAnswers,
          duration,
          completed: true,
          metadata: {
            routinesCompleted: completedRoutines,
            totalRoutines: completedRoutines.length,
          },
        }),
      });

      router.push(`/garden/${childId}/games`);
    } catch (error) {
      console.error("Failed to save game session:", error);
      router.push(`/garden/${childId}/games`);
    }
  };

  const currentRoutine = routines[routineType];

  // Intro Screen
  if (gameState === "intro") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-teal-50 to-cyan-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center gap-4 mb-6">
            <span className="text-5xl animate-bounce" style={{ animationDelay: "0s" }}>🌅</span>
            <span className="text-5xl animate-bounce" style={{ animationDelay: "0.1s" }}>🌙</span>
            <span className="text-5xl animate-bounce" style={{ animationDelay: "0.2s" }}>🎒</span>
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Routine Sequence
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-8">
            Hi {childName}! Put the activities in the right order!
          </p>

          <button
            onClick={() => setGameState("select")}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-teal-400 to-cyan-500 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Let&apos;s Play! 🎮
          </button>

          <Link
            href={`/garden/${childId}/games`}
            className="mt-4 inline-block text-sage-500 hover:text-sage-700 dark:hover:text-sage-300"
          >
            ← Back to Games
          </Link>
        </div>
      </div>
    );
  }

  // Routine Selection
  if (gameState === "select") {
    const allTypes: RoutineType[] = ["morning", "bedtime", "school"];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-teal-50 to-cyan-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-sage-900 dark:text-white mb-2">
            Choose a Routine
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-8">
            {completedRoutines.length > 0 
              ? `Great job! ${completedRoutines.length} routine${completedRoutines.length > 1 ? "s" : ""} done!`
              : "Which routine do you want to practice?"}
          </p>

          <div className="space-y-4">
            {allTypes.map((type) => {
              const routine = routines[type];
              const isCompleted = completedRoutines.includes(type);
              
              return (
                <button
                  key={type}
                  onClick={() => !isCompleted && startRoutine(type)}
                  disabled={isCompleted}
                  className={`w-full p-5 rounded-2xl transition-all flex items-center gap-4 ${
                    isCompleted
                      ? "bg-teal-100 dark:bg-teal-900/30 opacity-60"
                      : "bg-white dark:bg-sage-800 shadow-md hover:shadow-lg"
                  }`}
                >
                  <span className="text-4xl">{routine.emoji}</span>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sage-900 dark:text-white">{routine.name}</p>
                    <p className="text-sm text-sage-500">{routine.steps.length} steps</p>
                  </div>
                  {isCompleted && (
                    <span className="text-teal-500 text-2xl">✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {completedRoutines.length > 0 && (
            <button
              onClick={() => setGameState("complete")}
              className="mt-6 w-full py-3 rounded-xl bg-linear-to-r from-teal-400 to-cyan-500 text-white font-semibold"
            >
              I&apos;m Done Playing
            </button>
          )}

          <button
            onClick={() => setGameState("intro")}
            className="mt-4 text-sage-500 hover:text-sage-700 dark:hover:text-sage-300"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Complete Screen
  if (gameState === "complete") {
    const accuracy = attempts > 0 ? Math.round((correctAnswers / attempts) * 100) : 0;
    const stars = completedRoutines.length >= 3 ? 3 : completedRoutines.length >= 2 ? 2 : 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-teal-50 to-cyan-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {stars === 3 ? "🏆" : stars === 2 ? "⭐" : "👏"}
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Amazing, {childName}!
          </h1>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`text-4xl ${i <= stars ? "" : "opacity-30"}`}>
                ⭐
              </span>
            ))}
          </div>

          <div className="card p-6 mb-6">
            <p className="text-sm text-sage-500 mb-4">Routines Completed</p>
            <div className="flex justify-center gap-3 mb-4">
              {completedRoutines.map((type) => (
                <div key={type} className="flex flex-col items-center">
                  <span className="text-3xl">{routines[type].emoji}</span>
                  <span className="text-xs text-sage-500 mt-1">{routines[type].name.split(" ")[0]}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-sage-100 dark:border-sage-800">
              <p className="text-2xl font-bold text-sage-900 dark:text-white">{accuracy}%</p>
              <p className="text-sm text-sage-500">Accuracy</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setCompletedRoutines([]);
                setAttempts(0);
                setCorrectAnswers(0);
                setStartTime(null);
                setGameState("select");
              }}
              className="flex-1 py-3 rounded-xl bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300 font-semibold hover:bg-sage-200 dark:hover:bg-sage-700 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={saveSession}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-teal-400 to-cyan-500 text-white font-semibold shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Done ✓"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing / Checking Screen
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-teal-50 to-cyan-50 dark:from-sage-900 dark:to-sage-950">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/garden/${childId}/games`}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-sage-800/80 flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">close</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentRoutine.emoji}</span>
          <span className="font-medium text-sage-700 dark:text-sage-300">{currentRoutine.name}</span>
        </div>

        <div className="w-10" />
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col px-4 pb-6 overflow-hidden">
        {/* Instructions */}
        <div className="text-center mb-4">
          <p className="text-sage-600 dark:text-sage-400">
            {gameState === "checking"
              ? isCorrect
                ? "Perfect order! 🎉"
                : "Not quite right. Try again!"
              : "Tap cards to put them in order (1st to last)"}
          </p>
        </div>

        {/* Ordered Sequence (Drop Zone) */}
        <div className="mb-4">
          <p className="text-xs font-medium text-sage-500 mb-2 uppercase tracking-wide">Your Order:</p>
          <div className="min-h-30 bg-white/50 dark:bg-sage-800/50 rounded-2xl p-3 border-2 border-dashed border-sage-300 dark:border-sage-700">
            {orderedSteps.length === 0 ? (
              <p className="text-center text-sage-400 py-8">Tap cards below to start</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {orderedSteps.map((step, index) => {
                  const isInCorrectPosition = gameState === "checking" && step.order === index + 1;
                  const isInWrongPosition = gameState === "checking" && step.order !== index + 1;
                  
                  return (
                    <div
                      key={step.id}
                      draggable={gameState === "playing"}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => gameState === "playing" && handleRemoveFromOrder(index)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all
                        ${gameState === "playing" ? "bg-white dark:bg-sage-700 shadow-md hover:shadow-lg active:scale-95" : ""}
                        ${isInCorrectPosition ? "bg-teal-100 dark:bg-teal-900/30 ring-2 ring-teal-500" : ""}
                        ${isInWrongPosition ? "bg-coral-100 dark:bg-coral-900/30 ring-2 ring-coral-400" : ""}
                        ${draggedIndex === index ? "opacity-50 scale-105" : ""}
                      `}
                    >
                      <span className="text-xs font-bold text-sage-400 w-5">{index + 1}.</span>
                      <span className="text-xl">{step.icon}</span>
                      <span className="text-sm font-medium text-sage-700 dark:text-sage-300">{step.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Available Cards */}
        {shuffledSteps.length > 0 && (
          <div>
            <p className="text-xs font-medium text-sage-500 mb-2 uppercase tracking-wide">Available Cards:</p>
            <div className="flex flex-wrap gap-2">
              {shuffledSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleCardTap(step)}
                  disabled={gameState !== "playing"}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-sage-800 shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl">{step.icon}</span>
                  <span className="font-medium text-sage-700 dark:text-sage-300">{step.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Button */}
        <div className="mt-4">
          {gameState === "playing" && orderedSteps.length === currentRoutine.steps.length && (
            <button
              onClick={checkSequence}
              className={`w-full py-4 rounded-2xl bg-linear-to-r ${currentRoutine.color} text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95`}
            >
              Check My Order ✓
            </button>
          )}
          
          {gameState === "checking" && (
            <button
              onClick={continueGame}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-95 ${
                isCorrect
                  ? "bg-linear-to-r from-teal-400 to-cyan-500"
                  : "bg-linear-to-r from-coral-400 to-coral-500"
              }`}
            >
              {isCorrect ? "Continue →" : "Try Again"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
