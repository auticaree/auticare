"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Imitate the Move Game - Client Component
 * Game 5 from Auti-2.md specification
 * 
 * Objective: Motor imitation and body awareness
 * Target audience: Children aged 3-8 years
 * Duration: 2-4 minutes
 * 
 * Movements:
 * - Clapping hands
 * - Waving
 * - Raising arms
 * - Jumping (simulated)
 * - Touching nose
 * - Spinning (simulated)
 * 
 * Gameplay:
 * - Shows animated character doing a movement
 * - Child selects which movement was shown
 * - Encourages physical imitation (optional)
 */

interface ImitateMoveClientProps {
  childId: string;
  childName: string;
}

interface Movement {
  id: string;
  name: string;
  emoji: string;
  animation: string; // CSS animation class
  instruction: string;
  description: string;
}

const movements: Movement[] = [
  { 
    id: "clap", 
    name: "Clap Hands", 
    emoji: "👏", 
    animation: "animate-clap",
    instruction: "Clap your hands!",
    description: "Put your hands together!"
  },
  { 
    id: "wave", 
    name: "Wave", 
    emoji: "👋", 
    animation: "animate-wave",
    instruction: "Wave hello!",
    description: "Say hi with your hand!"
  },
  { 
    id: "arms-up", 
    name: "Arms Up", 
    emoji: "🙆", 
    animation: "animate-raise",
    instruction: "Raise your arms!",
    description: "Reach for the sky!"
  },
  { 
    id: "jump", 
    name: "Jump", 
    emoji: "🦘", 
    animation: "animate-jump",
    instruction: "Jump up!",
    description: "Bounce like a kangaroo!"
  },
  { 
    id: "nose", 
    name: "Touch Nose", 
    emoji: "👃", 
    animation: "animate-point",
    instruction: "Touch your nose!",
    description: "Point to your nose!"
  },
  { 
    id: "spin", 
    name: "Spin Around", 
    emoji: "💫", 
    animation: "animate-spin-slow",
    instruction: "Spin around!",
    description: "Turn in a circle!"
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ImitateMoveClient({ childId, childName }: ImitateMoveClientProps) {
  const router = useRouter();

  // Game state
  const [gameState, setGameState] = useState<"intro" | "showing" | "selecting" | "feedback" | "imitate" | "complete">("intro");
  const [currentRound, setCurrentRound] = useState(0);
  const [targetMove, setTargetMove] = useState<Movement | null>(null);
  const [options, setOptions] = useState<Movement[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showImitation, setShowImitation] = useState(true); // Toggle for imitation phase

  // Statistics
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRounds = 8;
  const numOptions = 4;

  // Generate a new round
  const generateRound = useCallback(() => {
    const target = movements[Math.floor(Math.random() * movements.length)];
    setTargetMove(target);
    
    // Get 3 other random movements
    const others = movements.filter((m) => m.id !== target.id);
    const selected = shuffleArray(others).slice(0, numOptions - 1);
    setOptions(shuffleArray([target, ...selected]));
    
    setSelectedOption(null);
    setIsCorrect(null);
    setGameState("showing");
  }, []);

  // Start game
  const startGame = () => {
    setCurrentRound(0);
    setAttempts(0);
    setCorrectAnswers(0);
    setStartTime(Date.now());
    generateRound();
  };

  // Transition from showing to selecting
  useEffect(() => {
    if (gameState === "showing") {
      const timer = setTimeout(() => {
        setGameState("selecting");
      }, 2500); // Show animation for 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Handle selection
  const handleSelect = (moveId: string) => {
    if (selectedOption !== null || gameState !== "selecting") return;

    setSelectedOption(moveId);
    setAttempts((prev) => prev + 1);

    const correct = moveId === targetMove?.id;
    setIsCorrect(correct);

    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }

    setGameState("feedback");
  };

  // Continue to imitation or next round
  const continueGame = () => {
    if (isCorrect && showImitation) {
      setGameState("imitate");
    } else {
      goToNextRound();
    }
  };

  // Go to next round
  const goToNextRound = () => {
    if (currentRound + 1 >= totalRounds) {
      setGameState("complete");
    } else {
      setCurrentRound((prev) => prev + 1);
      generateRound();
    }
  };

  // Retry
  const retryRound = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setGameState("showing");
  };

  // Auto-advance after feedback (for correct answers without imitation)
  useEffect(() => {
    if (gameState === "feedback" && isCorrect && !showImitation) {
      const timer = setTimeout(goToNextRound, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, isCorrect, showImitation]);

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
          gameType: "IMITATE_MOVE",
          attempts,
          correctAnswers,
          duration,
          completed: true,
          metadata: {
            movements: movements.map((m) => m.name),
            totalRounds,
            imitationEnabled: showImitation,
          },
        }),
      });

      router.push(`/garden/${childId}/games`);
    } catch (error) {
      console.error("Failed to save game session:", error);
      router.push(`/garden/${childId}/games`);
    }
  };

  // Intro Screen
  if (gameState === "intro") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-green-50 to-emerald-50 dark:from-sage-900 dark:to-sage-950">
        <style jsx global>{`
          @keyframes clap {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(20deg); }
            75% { transform: rotate(-20deg); }
          }
          @keyframes raise {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes jump {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          @keyframes point {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1) translateX(-5px); }
          }
          .animate-clap { animation: clap 0.5s ease-in-out infinite; }
          .animate-wave { animation: wave 0.5s ease-in-out infinite; }
          .animate-raise { animation: raise 0.8s ease-in-out infinite; }
          .animate-jump { animation: jump 0.6s ease-in-out infinite; }
          .animate-point { animation: point 0.8s ease-in-out infinite; }
          .animate-spin-slow { animation: spin 1.5s linear infinite; }
        `}</style>
        
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center gap-3 mb-6">
            {movements.slice(0, 4).map((m, i) => (
              <span 
                key={m.id} 
                className="text-4xl animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {m.emoji}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Imitate the Move
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-6">
            Hi {childName}! Watch the move and copy it!
          </p>

          {/* Imitation Toggle */}
          <div className="bg-white dark:bg-sage-800 rounded-xl p-4 mb-6">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="text-left">
                <p className="font-medium text-sage-700 dark:text-sage-300">Physical Imitation</p>
                <p className="text-xs text-sage-500">Pause to try the movement</p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showImitation}
                  onChange={(e) => setShowImitation(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-14 h-8 rounded-full transition-colors ${showImitation ? "bg-teal-500" : "bg-sage-300 dark:bg-sage-600"}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${showImitation ? "translate-x-7" : "translate-x-1"}`} />
                </div>
              </div>
            </label>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-green-400 to-emerald-500 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
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

  // Complete Screen
  if (gameState === "complete") {
    const accuracy = attempts > 0 ? Math.round((correctAnswers / attempts) * 100) : 0;
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-green-50 to-emerald-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {stars === 3 ? "🏆" : stars === 2 ? "⭐" : "👏"}
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Super Moves, {childName}!
          </h1>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <span key={i} className={`text-4xl ${i <= stars ? "" : "opacity-30"}`}>
                ⭐
              </span>
            ))}
          </div>

          <div className="card p-6 mb-6">
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
              onClick={startGame}
              className="flex-1 py-3 rounded-xl bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300 font-semibold hover:bg-sage-200 dark:hover:bg-sage-700 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={saveSession}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-green-400 to-emerald-500 text-white font-semibold shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Done ✓"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Imitation Phase
  if (gameState === "imitate") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-green-50 to-emerald-50 dark:from-sage-900 dark:to-sage-950">
        <style jsx global>{`
          @keyframes clap { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
          @keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 75% { transform: rotate(-20deg); } }
          @keyframes raise { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
          @keyframes jump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
          @keyframes point { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1) translateX(-5px); } }
          .animate-clap { animation: clap 0.5s ease-in-out infinite; }
          .animate-wave { animation: wave 0.5s ease-in-out infinite; }
          .animate-raise { animation: raise 0.8s ease-in-out infinite; }
          .animate-jump { animation: jump 0.6s ease-in-out infinite; }
          .animate-point { animation: point 0.8s ease-in-out infinite; }
          .animate-spin-slow { animation: spin 1.5s linear infinite; }
        `}</style>
        
        <div className="max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-sage-900 dark:text-white mb-2">
            Now You Try!
          </h2>
          <p className="text-sage-600 dark:text-sage-400 mb-6">
            {targetMove?.instruction}
          </p>

          <div className="mb-8">
            <div className={`text-9xl ${targetMove?.animation}`}>
              {targetMove?.emoji}
            </div>
            <p className="mt-4 text-sage-500">{targetMove?.description}</p>
          </div>

          <button
            onClick={goToNextRound}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-green-400 to-emerald-500 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            I Did It! ✓
          </button>
        </div>
      </div>
    );
  }

  // Showing / Selecting / Feedback Screen
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-b from-green-50 to-emerald-50 dark:from-sage-900 dark:to-sage-950">
      <style jsx global>{`
        @keyframes clap { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
        @keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(20deg); } 75% { transform: rotate(-20deg); } }
        @keyframes raise { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes jump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes point { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1) translateX(-5px); } }
        .animate-clap { animation: clap 0.5s ease-in-out infinite; }
        .animate-wave { animation: wave 0.5s ease-in-out infinite; }
        .animate-raise { animation: raise 0.8s ease-in-out infinite; }
        .animate-jump { animation: jump 0.6s ease-in-out infinite; }
        .animate-point { animation: point 0.8s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 1.5s linear infinite; }
      `}</style>
      
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/garden/${childId}/games`}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-sage-800/80 flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">close</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-sage-600 dark:text-sage-400">
            {currentRound + 1} / {totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 dark:bg-sage-800/80">
          <span className="text-green-500">⭐</span>
          <span className="font-semibold text-sage-700 dark:text-sage-300">{correctAnswers}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 mb-4">
        <div className="h-2 bg-white/50 dark:bg-sage-800/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentRound + 1) / totalRounds) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
        {/* Showing Phase */}
        {gameState === "showing" && (
          <div className="text-center">
            <p className="text-lg text-sage-600 dark:text-sage-400 mb-6">
              Watch the movement!
            </p>
            <div className={`text-9xl ${targetMove?.animation}`}>
              {targetMove?.emoji}
            </div>
            <p className="mt-6 text-xl font-bold text-sage-700 dark:text-sage-300">
              {targetMove?.name}
            </p>
          </div>
        )}

        {/* Selecting Phase */}
        {gameState === "selecting" && (
          <>
            <p className="text-lg text-sage-600 dark:text-sage-400 mb-8 text-center">
              What movement was that?
            </p>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {options.map((move) => (
                <button
                  key={move.id}
                  onClick={() => handleSelect(move.id)}
                  className="p-5 rounded-2xl bg-white dark:bg-sage-800 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-2"
                >
                  <span className="text-5xl">{move.emoji}</span>
                  <span className="font-semibold text-sage-700 dark:text-sage-300">{move.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Feedback Phase */}
        {gameState === "feedback" && (
          <>
            <div className="mb-6 text-center">
              {isCorrect ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-6xl">🎉</span>
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">Correct!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">🤔</span>
                  <span className="text-lg text-sage-500 dark:text-sage-400">
                    It was: {targetMove?.emoji} {targetMove?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              {options.map((move) => {
                const isSelected = selectedOption === move.id;
                const isAnswer = move.id === targetMove?.id;

                return (
                  <div
                    key={move.id}
                    className={`
                      p-5 rounded-2xl flex flex-col items-center gap-2 transition-all
                      ${isSelected && isCorrect ? "bg-teal-100 dark:bg-teal-900/30 ring-4 ring-teal-500" : ""}
                      ${isSelected && !isCorrect ? "bg-coral-100 dark:bg-coral-900/30 ring-4 ring-coral-400 opacity-60" : ""}
                      ${!isSelected && isAnswer ? "bg-teal-50 dark:bg-teal-900/20 ring-2 ring-teal-400" : ""}
                      ${!isSelected && !isAnswer ? "bg-white dark:bg-sage-800 opacity-40" : ""}
                    `}
                  >
                    <span className="text-5xl">{move.emoji}</span>
                    <span className="font-semibold text-sage-700 dark:text-sage-300">{move.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              {isCorrect ? (
                <button
                  onClick={continueGame}
                  className="px-8 py-3 rounded-xl bg-linear-to-r from-green-400 to-emerald-500 text-white font-semibold shadow-lg transition-all active:scale-95"
                >
                  {showImitation ? "Now Try It! →" : "Continue →"}
                </button>
              ) : (
                <button
                  onClick={retryRound}
                  className="px-8 py-3 rounded-xl bg-white dark:bg-sage-800 text-sage-700 dark:text-sage-300 font-semibold shadow-md transition-all"
                >
                  Try Again
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
