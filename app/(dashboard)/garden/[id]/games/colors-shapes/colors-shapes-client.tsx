"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Colors & Shapes Game - Client Component
 * Game 2 from Auti-2.md specification
 * 
 * Objective: Color and shape recognition
 * Target audience: Children aged 3-8 years
 * Duration: 1-3 minutes
 * 
 * Modes:
 * - Colors only
 * - Shapes only
 * - Combined (color + shape)
 * 
 * Colors: Red, Blue, Green, Yellow
 * Shapes: Circle, Square, Triangle, Star
 */

interface ColorsShapesClientProps {
  childId: string;
  childName: string;
}

type GameMode = "colors" | "shapes" | "combined";

interface GameItem {
  id: string;
  color: string;
  colorName: string;
  shape: string;
  shapeName: string;
}

const colors = [
  { id: "red", name: "Red", hex: "#EF4444", bg: "bg-red-500" },
  { id: "blue", name: "Blue", hex: "#3B82F6", bg: "bg-blue-500" },
  { id: "green", name: "Green", hex: "#22C55E", bg: "bg-green-500" },
  { id: "yellow", name: "Yellow", hex: "#EAB308", bg: "bg-yellow-500" },
];

const shapes = [
  { id: "circle", name: "Circle", icon: "●", path: "M50,50 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0" },
  { id: "square", name: "Square", icon: "■", path: "M15,15 L85,15 L85,85 L15,85 Z" },
  { id: "triangle", name: "Triangle", icon: "▲", path: "M50,10 L90,90 L10,90 Z" },
  { id: "star", name: "Star", icon: "★", path: "M50,5 L61,40 L98,40 L68,62 L79,97 L50,75 L21,97 L32,62 L2,40 L39,40 Z" },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shape SVG component
function ShapeSVG({ shape, color, size = 80 }: { shape: typeof shapes[0]; color: typeof colors[0]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <path d={shape.path} fill={color.hex} />
    </svg>
  );
}

export default function ColorsShapesClient({ childId, childName }: ColorsShapesClientProps) {
  const router = useRouter();

  // Game state
  const [gameState, setGameState] = useState<"intro" | "mode-select" | "playing" | "feedback" | "complete">("intro");
  const [gameMode, setGameMode] = useState<GameMode>("colors");
  const [currentRound, setCurrentRound] = useState(0);
  const [target, setTarget] = useState<GameItem | null>(null);
  const [options, setOptions] = useState<GameItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Statistics
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRounds = 8;

  // Generate options based on mode
  const generateRound = useCallback(() => {
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
    
    const targetItem: GameItem = {
      id: `${targetColor.id}-${targetShape.id}`,
      color: targetColor.id,
      colorName: targetColor.name,
      shape: targetShape.id,
      shapeName: targetShape.name,
    };
    
    setTarget(targetItem);

    let allOptions: GameItem[] = [];

    if (gameMode === "colors") {
      // Same shape, different colors
      allOptions = colors.map((c) => ({
        id: `${c.id}-${targetShape.id}`,
        color: c.id,
        colorName: c.name,
        shape: targetShape.id,
        shapeName: targetShape.name,
      }));
    } else if (gameMode === "shapes") {
      // Same color, different shapes
      allOptions = shapes.map((s) => ({
        id: `${targetColor.id}-${s.id}`,
        color: targetColor.id,
        colorName: targetColor.name,
        shape: s.id,
        shapeName: s.name,
      }));
    } else {
      // Combined: different colors AND shapes
      const combos: GameItem[] = [];
      for (const c of colors) {
        for (const s of shapes) {
          combos.push({
            id: `${c.id}-${s.id}`,
            color: c.id,
            colorName: c.name,
            shape: s.id,
            shapeName: s.name,
          });
        }
      }
      // Pick target + 3 random different ones
      const filtered = combos.filter((c) => c.id !== targetItem.id);
      const selected = shuffleArray(filtered).slice(0, 3);
      allOptions = shuffleArray([targetItem, ...selected]);
    }

    setOptions(shuffleArray(allOptions));
    setSelectedOption(null);
    setIsCorrect(null);
    setGameState("playing");
  }, [gameMode]);

  // Start game with selected mode
  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    setCurrentRound(0);
    setAttempts(0);
    setCorrectAnswers(0);
    setStartTime(Date.now());
    setTimeout(() => generateRound(), 0);
  };

  // useEffect to generate round after mode is set
  useEffect(() => {
    if (gameState === "playing" && !target) {
      generateRound();
    }
  }, [gameState, target, generateRound]);

  // Handle selection
  const handleSelect = (itemId: string) => {
    if (selectedOption !== null || gameState !== "playing") return;

    setSelectedOption(itemId);
    setAttempts((prev) => prev + 1);

    const correct = itemId === target?.id;
    setIsCorrect(correct);

    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }

    setGameState("feedback");
  };

  // Next round
  const nextRound = () => {
    if (currentRound + 1 >= totalRounds) {
      setGameState("complete");
    } else {
      setCurrentRound((prev) => prev + 1);
      setTarget(null);
      generateRound();
    }
  };

  // Retry
  const retryRound = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setGameState("playing");
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
          gameType: "COLORS_SHAPES",
          attempts,
          correctAnswers,
          duration,
          completed: true,
          metadata: { mode: gameMode, totalRounds },
        }),
      });

      router.push(`/garden/${childId}/games`);
    } catch (error) {
      console.error("Failed to save game session:", error);
      router.push(`/garden/${childId}/games`);
    }
  };

  // Auto-advance on correct
  useEffect(() => {
    if (gameState === "feedback" && isCorrect) {
      const timer = setTimeout(nextRound, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, isCorrect]);

  // Helper to get color/shape objects
  const getColor = (id: string) => colors.find((c) => c.id === id)!;
  const getShape = (id: string) => shapes.find((s) => s.id === id)!;

  // Get question text
  const getQuestionText = () => {
    if (!target) return "";
    if (gameMode === "colors") return `Find the ${target.colorName} shape!`;
    if (gameMode === "shapes") return `Find the ${target.shapeName}!`;
    return `Find the ${target.colorName} ${target.shapeName}!`;
  };

  // Intro Screen
  if (gameState === "intro") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-blue-50 to-indigo-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center gap-4 mb-6">
            {shapes.slice(0, 4).map((s, i) => (
              <div key={s.id} className="animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
                <ShapeSVG shape={s} color={colors[i]} size={60} />
              </div>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Colors & Shapes
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-8">
            Hi {childName}! Match colors and shapes!
          </p>

          <button
            onClick={() => setGameState("mode-select")}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-blue-400 to-indigo-500 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
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

  // Mode Selection
  if (gameState === "mode-select") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-blue-50 to-indigo-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-sage-900 dark:text-white mb-2">
            Choose a Mode
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-8">
            What would you like to practice?
          </p>

          <div className="space-y-4">
            <button
              onClick={() => startGame("colors")}
              className="w-full p-6 rounded-2xl bg-white dark:bg-sage-800 shadow-md hover:shadow-lg transition-all flex items-center gap-4"
            >
              <div className="flex -space-x-2">
                {colors.map((c) => (
                  <div key={c.id} className={`w-8 h-8 rounded-full ${c.bg} border-2 border-white dark:border-sage-800`} />
                ))}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sage-900 dark:text-white">Colors Only</p>
                <p className="text-sm text-sage-500">Match the colors</p>
              </div>
            </button>

            <button
              onClick={() => startGame("shapes")}
              className="w-full p-6 rounded-2xl bg-white dark:bg-sage-800 shadow-md hover:shadow-lg transition-all flex items-center gap-4"
            >
              <div className="flex gap-1">
                {shapes.map((s) => (
                  <span key={s.id} className="text-2xl text-sage-400">{s.icon}</span>
                ))}
              </div>
              <div className="text-left">
                <p className="font-semibold text-sage-900 dark:text-white">Shapes Only</p>
                <p className="text-sm text-sage-500">Match the shapes</p>
              </div>
            </button>

            <button
              onClick={() => startGame("combined")}
              className="w-full p-6 rounded-2xl bg-linear-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 shadow-md hover:shadow-lg transition-all flex items-center gap-4 ring-2 ring-blue-400"
            >
              <div className="flex gap-1">
                <ShapeSVG shape={shapes[0]} color={colors[0]} size={32} />
                <ShapeSVG shape={shapes[2]} color={colors[1]} size={32} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sage-900 dark:text-white">Combined</p>
                <p className="text-sm text-sage-500">Match color AND shape!</p>
              </div>
              <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Challenge</span>
            </button>
          </div>

          <button
            onClick={() => setGameState("intro")}
            className="mt-6 text-sage-500 hover:text-sage-700 dark:hover:text-sage-300"
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
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-blue-50 to-indigo-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {stars === 3 ? "🏆" : stars === 2 ? "⭐" : "👏"}
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Great Job, {childName}!
          </h1>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`text-4xl ${i <= stars ? "" : "opacity-30"}`}>
                ⭐
              </span>
            ))}
          </div>

          <div className="card p-6 mb-6">
            <p className="text-sm text-sage-500 mb-4">
              Mode: <span className="font-medium text-sage-700 dark:text-sage-300 capitalize">{gameMode}</span>
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-500">{correctAnswers}</p>
                <p className="text-sm text-sage-500">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-sage-700 dark:text-sage-300">{attempts}</p>
                <p className="text-sm text-sage-500">Total</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-sage-100 dark:border-sage-800">
              <p className="text-2xl font-bold text-sage-900 dark:text-white">{accuracy}%</p>
              <p className="text-sm text-sage-500">Accuracy</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setGameState("mode-select")}
              className="flex-1 py-3 rounded-xl bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300 font-semibold hover:bg-sage-200 dark:hover:bg-sage-700 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={saveSession}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-blue-400 to-indigo-500 text-white font-semibold shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Done ✓"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing / Feedback Screen
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-blue-50 to-indigo-50 dark:from-sage-900 dark:to-sage-950">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/garden/${childId}/games`}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-sage-800/80 flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">close</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/80 dark:bg-sage-800/80 px-2 py-1 rounded-full font-medium text-sage-600 dark:text-sage-400 capitalize">
            {gameMode}
          </span>
          <span className="text-sm font-medium text-sage-600 dark:text-sage-400">
            {currentRound + 1} / {totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 dark:bg-sage-800/80">
          <span className="text-blue-500">⭐</span>
          <span className="font-semibold text-sage-700 dark:text-sage-300">{correctAnswers}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 mb-4">
        <div className="h-2 bg-white/50 dark:bg-sage-800/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentRound + 1) / totalRounds) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
        {/* Question */}
        <p className="text-lg text-sage-600 dark:text-sage-400 mb-6 text-center">
          {getQuestionText()}
        </p>

        {/* Target Display */}
        {target && (
          <div className={`mb-8 p-6 rounded-3xl bg-white dark:bg-sage-800 shadow-lg transform transition-transform ${gameState === "feedback" ? (isCorrect ? "scale-110" : "scale-95") : ""}`}>
            <ShapeSVG shape={getShape(target.shape)} color={getColor(target.color)} size={100} />
          </div>
        )}

        {/* Feedback Message */}
        {gameState === "feedback" && (
          <div className="mb-6 text-center animate-fade-in">
            {isCorrect ? (
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <span className="text-2xl">🎉</span>
                <span className="text-xl font-bold">Correct!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sage-500 dark:text-sage-400">
                <span className="text-xl">🤔</span>
                <span className="text-lg">Try again!</span>
              </div>
            )}
          </div>
        )}

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {options.map((item) => {
            const isSelected = selectedOption === item.id;
            const showResult = gameState === "feedback" && isSelected;
            const isAnswer = item.id === target?.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                disabled={gameState !== "playing"}
                className={`
                  p-4 rounded-2xl flex items-center justify-center transition-all duration-200
                  ${gameState === "playing"
                    ? "bg-white dark:bg-sage-800 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                    : ""}
                  ${showResult && isCorrect
                    ? "bg-teal-100 dark:bg-teal-900/30 ring-4 ring-teal-500 scale-105"
                    : ""}
                  ${showResult && !isCorrect
                    ? "bg-coral-100 dark:bg-coral-900/30 ring-4 ring-coral-400 opacity-60"
                    : ""}
                  ${gameState === "feedback" && !isSelected && isAnswer
                    ? "bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-400"
                    : ""}
                  ${gameState === "feedback" && !isSelected && !isAnswer
                    ? "opacity-40"
                    : ""}
                  disabled:cursor-default
                `}
              >
                <ShapeSVG shape={getShape(item.shape)} color={getColor(item.color)} size={60} />
              </button>
            );
          })}
        </div>

        {/* Retry Button */}
        {gameState === "feedback" && !isCorrect && (
          <button
            onClick={retryRound}
            className="mt-6 px-8 py-3 rounded-xl bg-white dark:bg-sage-800 text-sage-700 dark:text-sage-300 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Try Again
          </button>
        )}
      </main>
    </div>
  );
}
