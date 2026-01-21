"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Emotion Match Game - Client Component
 * Game 1 from Auti-2.md specification
 * 
 * Objective: Emotion recognition
 * Target audience: Children aged 3-8 years
 * Duration: 1-3 minutes
 * 
 * Gameplay:
 * - Shows a facial expression
 * - Child selects matching emotion from 3-4 options
 * - Positive animation for correct answers
 * - Neutral retry message for incorrect
 * 
 * Emotions: Happy, Sad, Angry, Surprised
 */

interface EmotionMatchClientProps {
    childId: string;
    childName: string;
}

interface Emotion {
    id: string;
    name: string;
    emoji: string;
    color: string;
    bgColor: string;
}

const emotions: Emotion[] = [
    { id: "happy", name: "Happy", emoji: "😊", color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
    { id: "sad", name: "Sad", emoji: "😢", color: "text-blue-500", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
    { id: "angry", name: "Angry", emoji: "😠", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/30" },
    { id: "surprised", name: "Surprised", emoji: "😲", color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
];

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function EmotionMatchClient({ childId, childName }: EmotionMatchClientProps) {
    const router = useRouter();

    // Game state
    const [gameState, setGameState] = useState<"intro" | "playing" | "feedback" | "complete">("intro");
    const [currentRound, setCurrentRound] = useState(0);
    const [targetEmotion, setTargetEmotion] = useState<Emotion | null>(null);
    const [options, setOptions] = useState<Emotion[]>([]);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    // Statistics
    const [attempts, setAttempts] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalRounds = 8; // 2 rounds per emotion
    const numOptions = 4; // Show all 4 emotions as options

    // Generate a new round
    const generateRound = useCallback(() => {
        // Pick a random target emotion
        const target = emotions[Math.floor(Math.random() * emotions.length)];
        setTargetEmotion(target);

        // Shuffle all emotions as options
        setOptions(shuffleArray(emotions));

        setSelectedOption(null);
        setIsCorrect(null);
        setGameState("playing");
    }, []);

    // Start game
    const startGame = () => {
        setCurrentRound(0);
        setAttempts(0);
        setCorrectAnswers(0);
        setStartTime(Date.now());
        generateRound();
    };

    // Handle option selection
    const handleSelect = (emotionId: string) => {
        if (selectedOption !== null || gameState !== "playing") return;

        setSelectedOption(emotionId);
        setAttempts((prev) => prev + 1);

        const correct = emotionId === targetEmotion?.id;
        setIsCorrect(correct);

        if (correct) {
            setCorrectAnswers((prev) => prev + 1);
        }

        setGameState("feedback");
    };

    // Continue to next round
    const nextRound = () => {
        if (currentRound + 1 >= totalRounds) {
            setGameState("complete");
        } else {
            setCurrentRound((prev) => prev + 1);
            generateRound();
        }
    };

    // Retry same round (for incorrect answers)
    const retryRound = () => {
        setSelectedOption(null);
        setIsCorrect(null);
        setGameState("playing");
    };

    // Save game session
    const saveSession = async () => {
        if (isSubmitting || !startTime) return;

        setIsSubmitting(true);
        const duration = Math.round((Date.now() - startTime) / 1000);

        try {
            await fetch(`/api/children/${childId}/games`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameType: "EMOTION_MATCH",
                    attempts,
                    correctAnswers,
                    duration,
                    completed: true,
                    metadata: {
                        emotions: emotions.map(e => e.name),
                        totalRounds,
                    },
                }),
            });

            router.push(`/garden/${childId}/games`);
        } catch (error) {
            console.error("Failed to save game session:", error);
            router.push(`/garden/${childId}/games`);
        }
    };

    // Auto-advance after feedback (for correct answers)
    useEffect(() => {
        if (gameState === "feedback" && isCorrect) {
            const timer = setTimeout(nextRound, 1500);
            return () => clearTimeout(timer);
        }
    }, [gameState, isCorrect]);

    // Intro Screen
    if (gameState === "intro") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-amber-50 to-orange-50 dark:from-sage-900 dark:to-sage-950">
                <div className="max-w-md w-full text-center">
                    <div className="text-8xl mb-6 animate-bounce">😊</div>
                    <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
                        Emotion Match
                    </h1>
                    <p className="text-sage-600 dark:text-sage-400 mb-8">
                        Hi {childName}! Match the face with the right emotion!
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {emotions.map((e) => (
                            <div
                                key={e.id}
                                className={`p-3 rounded-xl ${e.bgColor} flex flex-col items-center`}
                            >
                                <span className="text-3xl">{e.emoji}</span>
                                <span className="text-xs mt-1 font-medium text-sage-700 dark:text-sage-300">{e.name}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={startGame}
                        className="w-full py-4 rounded-2xl bg-linear-to-r from-amber-400 to-orange-500 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
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
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-amber-50 to-orange-50 dark:from-sage-900 dark:to-sage-950">
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
                            className="flex-1 py-3 rounded-xl bg-linear-to-r from-amber-400 to-orange-500 text-white font-semibold shadow-lg disabled:opacity-50"
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
        <div className="min-h-screen flex flex-col bg-linear-to-b from-amber-50 to-orange-50 dark:from-sage-900 dark:to-sage-950">
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
                    <span className="text-amber-500">⭐</span>
                    <span className="font-semibold text-sage-700 dark:text-sage-300">{correctAnswers}</span>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="px-4 mb-4">
                <div className="h-2 bg-white/50 dark:bg-sage-800/50 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-linear-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${((currentRound + 1) / totalRounds) * 100}%` }}
                    />
                </div>
            </div>

            {/* Main Game Area */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
                {/* Target Emotion Display */}
                <div className="mb-8 text-center">
                    <p className="text-lg text-sage-600 dark:text-sage-400 mb-4">
                        How does this face feel?
                    </p>
                    <div className={`w-32 h-32 rounded-3xl ${targetEmotion?.bgColor} flex items-center justify-center shadow-lg transform transition-transform ${gameState === "feedback" ? (isCorrect ? "scale-110" : "scale-95") : ""}`}>
                        <span className="text-7xl">{targetEmotion?.emoji}</span>
                    </div>
                </div>

                {/* Feedback Message */}
                {gameState === "feedback" && (
                    <div className={`mb-6 text-center animate-fade-in`}>
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
                    {options.map((emotion) => {
                        const isSelected = selectedOption === emotion.id;
                        const showResult = gameState === "feedback" && isSelected;
                        const isAnswer = emotion.id === targetEmotion?.id;

                        return (
                            <button
                                key={emotion.id}
                                onClick={() => handleSelect(emotion.id)}
                                disabled={gameState !== "playing"}
                                className={`
                  p-6 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200
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
                                <span className="text-5xl">{emotion.emoji}</span>
                                <span className={`font-semibold ${emotion.color}`}>{emotion.name}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Retry Button (for incorrect answers) */}
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
