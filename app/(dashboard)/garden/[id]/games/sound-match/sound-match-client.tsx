"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Sound Match Game - Client Component
 * Game 4 from Auti-2.md specification
 * 
 * Objective: Sound identification and matching
 * Target audience: Children aged 3-8 years
 * Duration: 2-4 minutes
 * 
 * Features:
 * - Audio playback with volume control
 * - Match sound to corresponding image
 * - Gentle sounds suitable for sensitive children
 * 
 * Sound Categories:
 * - Animals: Dog, Cat, Bird, Cow
 * - Nature: Rain, Wind, Thunder, Ocean
 * - Everyday: Bell, Clock, Phone, Door
 */

interface SoundMatchClientProps {
  childId: string;
  childName: string;
}

type SoundCategory = "animals" | "nature" | "everyday";

interface SoundItem {
  id: string;
  name: string;
  emoji: string;
  sound: string; // Onomatopoeia for display/voice synthesis
  description: string;
}

const soundCategories: Record<SoundCategory, { name: string; emoji: string; items: SoundItem[] }> = {
  animals: {
    name: "Animals",
    emoji: "🐾",
    items: [
      { id: "dog", name: "Dog", emoji: "🐕", sound: "Woof woof!", description: "A dog barking" },
      { id: "cat", name: "Cat", emoji: "🐱", sound: "Meow meow!", description: "A cat meowing" },
      { id: "bird", name: "Bird", emoji: "🐦", sound: "Tweet tweet!", description: "A bird chirping" },
      { id: "cow", name: "Cow", emoji: "🐄", sound: "Moo moo!", description: "A cow mooing" },
    ],
  },
  nature: {
    name: "Nature",
    emoji: "🌿",
    items: [
      { id: "rain", name: "Rain", emoji: "🌧️", sound: "Pitter patter!", description: "Rain falling" },
      { id: "wind", name: "Wind", emoji: "💨", sound: "Whoosh whoosh!", description: "Wind blowing" },
      { id: "thunder", name: "Thunder", emoji: "⛈️", sound: "Boom rumble!", description: "Thunder roaring" },
      { id: "ocean", name: "Ocean", emoji: "🌊", sound: "Splash swoosh!", description: "Waves crashing" },
    ],
  },
  everyday: {
    name: "Everyday",
    emoji: "🏠",
    items: [
      { id: "bell", name: "Bell", emoji: "🔔", sound: "Ding dong!", description: "A bell ringing" },
      { id: "clock", name: "Clock", emoji: "⏰", sound: "Tick tock!", description: "A clock ticking" },
      { id: "phone", name: "Phone", emoji: "📱", sound: "Ring ring!", description: "A phone ringing" },
      { id: "door", name: "Door", emoji: "🚪", sound: "Knock knock!", description: "Someone knocking" },
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

export default function SoundMatchClient({ childId, childName }: SoundMatchClientProps) {
  const router = useRouter();
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Game state
  const [gameState, setGameState] = useState<"intro" | "category" | "playing" | "feedback" | "complete">("intro");
  const [category, setCategory] = useState<SoundCategory>("animals");
  const [currentRound, setCurrentRound] = useState(0);
  const [targetSound, setTargetSound] = useState<SoundItem | null>(null);
  const [options, setOptions] = useState<SoundItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);

  // Statistics
  const [attempts, setAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalRounds = 8;

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechSynthRef.current = new SpeechSynthesisUtterance();
      speechSynthRef.current.rate = 0.8; // Slower for children
      speechSynthRef.current.pitch = 1.1; // Slightly higher pitch
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Play sound using speech synthesis
  const playSound = useCallback((sound: SoundItem) => {
    if (!speechSynthRef.current || typeof window === "undefined") return;
    
    window.speechSynthesis.cancel();
    setIsPlaying(true);
    
    const utterance = speechSynthRef.current;
    utterance.text = sound.sound;
    utterance.volume = volume;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  }, [volume]);

  // Generate a new round
  const generateRound = useCallback(() => {
    const items = soundCategories[category].items;
    const target = items[Math.floor(Math.random() * items.length)];
    setTargetSound(target);
    setOptions(shuffleArray([...items]));
    setSelectedOption(null);
    setIsCorrect(null);
    setGameState("playing");
  }, [category]);

  // Start game with selected category
  const startGame = (cat: SoundCategory) => {
    setCategory(cat);
    setCurrentRound(0);
    setAttempts(0);
    setCorrectAnswers(0);
    setStartTime(Date.now());
    setTimeout(() => {
      const items = soundCategories[cat].items;
      const target = items[Math.floor(Math.random() * items.length)];
      setTargetSound(target);
      setOptions(shuffleArray([...items]));
      setGameState("playing");
    }, 0);
  };

  // Handle selection
  const handleSelect = (itemId: string) => {
    if (selectedOption !== null || gameState !== "playing") return;

    setSelectedOption(itemId);
    setAttempts((prev) => prev + 1);

    const correct = itemId === targetSound?.id;
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
      generateRound();
    }
  };

  // Retry
  const retryRound = () => {
    setSelectedOption(null);
    setIsCorrect(null);
    setGameState("playing");
  };

  // Auto-advance on correct
  useEffect(() => {
    if (gameState === "feedback" && isCorrect) {
      const timer = setTimeout(nextRound, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, isCorrect]);

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
          gameType: "SOUND_MATCH",
          attempts,
          correctAnswers,
          duration,
          completed: true,
          metadata: { category, totalRounds },
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-purple-50 to-pink-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center gap-3 mb-6">
            <span className="text-5xl animate-bounce" style={{ animationDelay: "0s" }}>🔊</span>
            <span className="text-5xl animate-bounce" style={{ animationDelay: "0.15s" }}>🎵</span>
            <span className="text-5xl animate-bounce" style={{ animationDelay: "0.3s" }}>👂</span>
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Sound Match
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-8">
            Hi {childName}! Listen to sounds and match them!
          </p>

          <button
            onClick={() => setGameState("category")}
            className="w-full py-4 rounded-2xl bg-linear-to-r from-purple-400 to-pink-500 text-white font-bold text-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
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

  // Category Selection
  if (gameState === "category") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-brom-purple-50 to-pink-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-sage-900 dark:text-white mb-2">
            Choose Sounds
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mb-8">
            What sounds would you like to hear?
          </p>

          <div className="space-y-4">
            {(Object.keys(soundCategories) as SoundCategory[]).map((cat) => {
              const catData = soundCategories[cat];
              return (
                <button
                  key={cat}
                  onClick={() => startGame(cat)}
                  className="w-full p-5 rounded-2xl bg-white dark:bg-sage-800 shadow-md hover:shadow-lg transition-all flex items-center gap-4"
                >
                  <span className="text-4xl">{catData.emoji}</span>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-sage-900 dark:text-white">{catData.name}</p>
                    <div className="flex gap-1 mt-1">
                      {catData.items.slice(0, 4).map((item) => (
                        <span key={item.id} className="text-lg">{item.emoji}</span>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="mt-8 p-4 bg-white dark:bg-sage-800 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-sage-200 dark:bg-sage-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xl">🔊</span>
            </div>
            <p className="text-xs text-sage-500 mt-2">Adjust volume for comfort</p>
          </div>

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
    const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-b from-purple-50 to-pink-50 dark:from-sage-900 dark:to-sage-950">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {stars === 3 ? "🏆" : stars === 2 ? "⭐" : "👏"}
          </div>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-white mb-2">
            Great Ears, {childName}!
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
              Category: <span className="font-medium text-sage-700 dark:text-sage-300 capitalize">{soundCategories[category].name}</span>
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
              onClick={() => setGameState("category")}
              className="flex-1 py-3 rounded-xl bg-sage-100 dark:bg-sage-800 text-sage-700 dark:text-sage-300 font-semibold hover:bg-sage-200 dark:hover:bg-sage-700 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={saveSession}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-linear-to-rrom-purple-400 to-pink-500 text-white font-semibold shadow-lg disabled:opacity-50"
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
    <div className="min-h-screen flex flex-col bg-linear-to-b from-purple-50 to-pink-50 dark:from-sage-900 dark:to-sage-950">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Link
          href={`/garden/${childId}/games`}
          className="w-10 h-10 rounded-full bg-white/80 dark:bg-sage-800/80 flex items-center justify-center shadow-sm"
        >
          <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">close</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-lg">{soundCategories[category].emoji}</span>
          <span className="text-sm font-medium text-sage-600 dark:text-sage-400">
            {currentRound + 1} / {totalRounds}
          </span>
        </div>

        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 dark:bg-sage-800/80">
          <span className="text-purple-500">⭐</span>
          <span className="font-semibold text-sage-700 dark:text-sage-300">{correctAnswers}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-4 mb-4">
        <div className="h-2 bg-white/50 dark:bg-sage-800/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentRound + 1) / totalRounds) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-6">
        {/* Play Sound Button */}
        <div className="mb-8 text-center">
          <p className="text-lg text-sage-600 dark:text-sage-400 mb-4">
            Listen to the sound!
          </p>
          <button
            onClick={() => targetSound && playSound(targetSound)}
            disabled={isPlaying}
            className={`w-32 h-32 rounded-full bg-white dark:bg-sage-800 shadow-lg flex items-center justify-center transition-all ${
              isPlaying ? "animate-pulse scale-110" : "hover:scale-105 active:scale-95"
            }`}
          >
            <span className="text-6xl">{isPlaying ? "🔊" : "▶️"}</span>
          </button>
          {targetSound && (
            <p className="mt-3 text-sm text-sage-500">
              {targetSound.description}
            </p>
          )}
        </div>

        {/* Feedback Message */}
        {gameState === "feedback" && (
          <div className="mb-6 text-center animate-fade-in">
            {isCorrect ? (
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <span className="text-2xl">🎉</span>
                <span className="text-xl font-bold">Correct!</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-sage-500 dark:text-sage-400">
                <span className="text-xl">🤔</span>
                <span className="text-lg">That was: {targetSound?.emoji} {targetSound?.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Question */}
        <p className="text-center text-sage-600 dark:text-sage-400 mb-4">
          What makes this sound?
        </p>

        {/* Options Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {options.map((item) => {
            const isSelected = selectedOption === item.id;
            const showResult = gameState === "feedback" && isSelected;
            const isAnswer = item.id === targetSound?.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                disabled={gameState !== "playing"}
                className={`
                  p-5 rounded-2xl flex flex-col items-center gap-2 transition-all duration-200
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
                <span className="text-5xl">{item.emoji}</span>
                <span className="font-semibold text-sage-700 dark:text-sage-300">{item.name}</span>
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
