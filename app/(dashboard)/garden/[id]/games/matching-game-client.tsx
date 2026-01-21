"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface MatchingGameClientProps {
    childId: string;
    childName: string;
    gardenId: string | null;
}

interface Card {
    id: number;
    emoji: string;
    name: string;
    isFlipped: boolean;
    isMatched: boolean;
}

// Theme sets for the matching game - calm, autism-friendly imagery
const cardThemes = {
    animals: [
        { emoji: "🐱", name: "Cat" },
        { emoji: "🐶", name: "Dog" },
        { emoji: "🐰", name: "Bunny" },
        { emoji: "🦋", name: "Butterfly" },
        { emoji: "🐢", name: "Turtle" },
        { emoji: "🐠", name: "Fish" },
    ],
    nature: [
        { emoji: "🌻", name: "Sunflower" },
        { emoji: "🌈", name: "Rainbow" },
        { emoji: "⭐", name: "Star" },
        { emoji: "🌙", name: "Moon" },
        { emoji: "☁️", name: "Cloud" },
        { emoji: "🍀", name: "Clover" },
    ],
    shapes: [
        { emoji: "🔴", name: "Circle" },
        { emoji: "🟡", name: "Yellow" },
        { emoji: "🟢", name: "Green" },
        { emoji: "🔵", name: "Blue" },
        { emoji: "🟣", name: "Purple" },
        { emoji: "🟠", name: "Orange" },
    ],
};

export default function MatchingGameClient({
    childId,
    childName,
    gardenId,
}: MatchingGameClientProps) {
    const [theme, setTheme] = useState<keyof typeof cardThemes>("animals");
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [gameState, setGameState] = useState<"menu" | "playing" | "won">("menu");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [difficulty, setDifficulty] = useState<"easy" | "medium">("easy");

    // Initialize game
    const initializeGame = useCallback(() => {
        const themeCards = cardThemes[theme];
        const pairCount = difficulty === "easy" ? 4 : 6;
        const selectedCards = themeCards.slice(0, pairCount);

        // Create pairs
        const cardPairs = selectedCards.flatMap((card, index) => [
            { id: index * 2, emoji: card.emoji, name: card.name, isFlipped: false, isMatched: false },
            { id: index * 2 + 1, emoji: card.emoji, name: card.name, isFlipped: false, isMatched: false },
        ]);

        // Shuffle cards
        const shuffled = cardPairs.sort(() => Math.random() - 0.5);

        setCards(shuffled);
        setFlippedCards([]);
        setMatchedPairs(0);
        setMoves(0);
        setGameState("playing");
    }, [theme, difficulty]);

    // Handle card click
    const handleCardClick = (cardId: number) => {
        if (isProcessing) return;

        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;
        if (flippedCards.length >= 2) return;

        // Flip card
        setCards(prev =>
            prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c)
        );

        const newFlipped = [...flippedCards, cardId];
        setFlippedCards(newFlipped);

        // Check for match
        if (newFlipped.length === 2) {
            setIsProcessing(true);
            setMoves(prev => prev + 1);

            const [firstId, secondId] = newFlipped;
            const firstCard = cards.find(c => c.id === firstId);
            const secondCard = cards.find(c => c.id === secondId);

            if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
                // Match found!
                setTimeout(() => {
                    setCards(prev =>
                        prev.map(c =>
                            c.id === firstId || c.id === secondId
                                ? { ...c, isMatched: true }
                                : c
                        )
                    );
                    setMatchedPairs(prev => {
                        const newPairs = prev + 1;
                        const totalPairs = difficulty === "easy" ? 4 : 6;
                        if (newPairs === totalPairs) {
                            setShowCelebration(true);
                            setTimeout(() => {
                                setShowCelebration(false);
                                setGameState("won");
                            }, 2000);
                        }
                        return newPairs;
                    });
                    setFlippedCards([]);
                    setIsProcessing(false);
                }, 600);
            } else {
                // No match - flip back
                setTimeout(() => {
                    setCards(prev =>
                        prev.map(c =>
                            c.id === firstId || c.id === secondId
                                ? { ...c, isFlipped: false }
                                : c
                        )
                    );
                    setFlippedCards([]);
                    setIsProcessing(false);
                }, 1200);
            }
        }
    };

    // Award XP when winning
    const awardXP = async () => {
        if (!gardenId) return;

        try {
            // Award 20 XP for completing the game
            await fetch(`/api/garden/${gardenId}/bonus`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: 20,
                    reason: "Completed matching game"
                }),
            });
        } catch (error) {
            console.error("Error awarding XP:", error);
        }
    };

    useEffect(() => {
        if (gameState === "won" && gardenId) {
            awardXP();
        }
    }, [gameState, gardenId]);

    return (
        <div className="min-h-screen bg-linear-to-b from-primary-50 to-teal-50 dark:from-sage-900 dark:to-sage-900 pb-8">
            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white dark:bg-sage-800 rounded-3xl p-8 shadow-2xl text-center transform animate-bounce">
                        <div className="text-7xl mb-4">🎉</div>
                        <h3 className="text-3xl font-bold text-sage-900 dark:text-white">
                            Amazing!
                        </h3>
                        <p className="text-primary-500 font-medium text-lg mt-2">
                            You found all the matches!
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-sage-800/80 backdrop-blur-md border-b border-sage-100 dark:border-sage-700">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <Link
                        href={`/garden/${childId}`}
                        className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors"
                    >
                        <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                            arrow_back
                        </span>
                    </Link>
                    <h1 className="text-xl font-bold text-sage-900 dark:text-white">
                        Matching Game
                    </h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 pt-6">
                {/* Menu State */}
                {gameState === "menu" && (
                    <div className="space-y-6">
                        <div className="card p-6 text-center">
                            <div className="text-6xl mb-4">🎴</div>
                            <h2 className="text-2xl font-bold text-sage-900 dark:text-white mb-2">
                                Hi, {childName}!
                            </h2>
                            <p className="text-sage-600 dark:text-sage-400">
                                Find matching pairs to win!
                            </p>
                        </div>

                        {/* Theme Selection */}
                        <div className="card p-5">
                            <h3 className="font-semibold text-sage-900 dark:text-white mb-4">
                                Choose a Theme
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {(Object.keys(cardThemes) as Array<keyof typeof cardThemes>).map(
                                    (themeName) => (
                                        <button
                                            key={themeName}
                                            onClick={() => setTheme(themeName)}
                                            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${theme === themeName
                                                    ? "bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500"
                                                    : "bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700"
                                                }`}
                                        >
                                            <span className="text-3xl">
                                                {themeName === "animals" && "🐱"}
                                                {themeName === "nature" && "🌻"}
                                                {themeName === "shapes" && "🔴"}
                                            </span>
                                            <span className="text-sm font-medium capitalize text-sage-700 dark:text-sage-300">
                                                {themeName}
                                            </span>
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Difficulty Selection */}
                        <div className="card p-5">
                            <h3 className="font-semibold text-sage-900 dark:text-white mb-4">
                                Choose Difficulty
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setDifficulty("easy")}
                                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${difficulty === "easy"
                                            ? "bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500"
                                            : "bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700"
                                        }`}
                                >
                                    <span className="text-2xl">😊</span>
                                    <span className="text-sm font-medium text-sage-700 dark:text-sage-300">
                                        Easy (4 pairs)
                                    </span>
                                </button>
                                <button
                                    onClick={() => setDifficulty("medium")}
                                    className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${difficulty === "medium"
                                            ? "bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500"
                                            : "bg-sage-50 dark:bg-sage-800 hover:bg-sage-100 dark:hover:bg-sage-700"
                                        }`}
                                >
                                    <span className="text-2xl">🌟</span>
                                    <span className="text-sm font-medium text-sage-700 dark:text-sage-300">
                                        Medium (6 pairs)
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={initializeGame}
                            className="w-full btn-primary py-4 text-lg font-semibold"
                        >
                            <span className="material-symbols-rounded mr-2">play_arrow</span>
                            Start Game
                        </button>
                    </div>
                )}

                {/* Playing State */}
                {gameState === "playing" && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-primary-500">
                                    favorite
                                </span>
                                <span className="font-semibold text-sage-900 dark:text-white">
                                    {matchedPairs}/{difficulty === "easy" ? 4 : 6} pairs
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-amber-500">
                                    touch_app
                                </span>
                                <span className="font-semibold text-sage-900 dark:text-white">
                                    {moves} moves
                                </span>
                            </div>
                        </div>

                        {/* Game Grid */}
                        <div
                            className={`grid gap-3 ${difficulty === "easy" ? "grid-cols-4" : "grid-cols-4"
                                }`}
                        >
                            {cards.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    disabled={card.isFlipped || card.isMatched || isProcessing}
                                    className={`aspect-square rounded-xl flex items-center justify-center text-4xl transition-all duration-300 transform ${card.isFlipped || card.isMatched
                                            ? "bg-white dark:bg-sage-800 rotate-y-0 shadow-lg"
                                            : "bg-primary-500 hover:bg-primary-600 scale-100 hover:scale-105"
                                        } ${card.isMatched ? "ring-2 ring-teal-500 opacity-80" : ""}`}
                                    style={{
                                        perspective: "1000px",
                                    }}
                                >
                                    {card.isFlipped || card.isMatched ? (
                                        <span className="animate-fade-in">{card.emoji}</span>
                                    ) : (
                                        <span className="text-white/30">?</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Restart Button */}
                        <button
                            onClick={() => setGameState("menu")}
                            className="w-full btn-secondary"
                        >
                            <span className="material-symbols-rounded mr-2">refresh</span>
                            Change Settings
                        </button>
                    </div>
                )}

                {/* Won State */}
                {gameState === "won" && (
                    <div className="space-y-6">
                        <div className="card p-8 text-center">
                            <div className="text-7xl mb-4">🏆</div>
                            <h2 className="text-2xl font-bold text-sage-900 dark:text-white mb-2">
                                Great Job, {childName}!
                            </h2>
                            <p className="text-sage-600 dark:text-sage-400 mb-4">
                                You completed the game in {moves} moves!
                            </p>
                            {gardenId && (
                                <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 px-4 py-2 rounded-full">
                                    <span className="material-symbols-rounded text-primary-500">
                                        add_circle
                                    </span>
                                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                                        +20 XP earned!
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={initializeGame} className="btn-primary py-4">
                                <span className="material-symbols-rounded mr-2">replay</span>
                                Play Again
                            </button>
                            <Link
                                href={`/garden/${childId}`}
                                className="btn-secondary py-4 text-center"
                            >
                                <span className="material-symbols-rounded mr-2">park</span>
                                Back to Garden
                            </Link>
                        </div>

                        {/* Star Rating */}
                        <div className="card p-5 text-center">
                            <h3 className="font-semibold text-sage-900 dark:text-white mb-3">
                                Your Score
                            </h3>
                            <div className="flex justify-center gap-1">
                                {[1, 2, 3].map((star) => {
                                    const totalPairs = difficulty === "easy" ? 4 : 6;
                                    const perfectMoves = totalPairs;
                                    const goodMoves = perfectMoves * 2;
                                    const earned =
                                        moves <= perfectMoves
                                            ? 3
                                            : moves <= goodMoves
                                                ? 2
                                                : 1;
                                    return (
                                        <span
                                            key={star}
                                            className={`text-4xl ${star <= earned ? "opacity-100" : "opacity-30"
                                                }`}
                                        >
                                            ⭐
                                        </span>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-sage-500 mt-2">
                                {moves <= (difficulty === "easy" ? 4 : 6)
                                    ? "Perfect memory!"
                                    : moves <= (difficulty === "easy" ? 8 : 12)
                                        ? "Great job!"
                                        : "Keep practicing!"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
