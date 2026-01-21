import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Games Hub Page
 * Central page for accessing all therapeutic games
 * Based on: Auti-2.md - Technical Specification – Simple Therapeutic Games (V1)
 */
export default async function GamesHubPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: childId } = await params;
  const userRole = session.user.role as Role;

  // Get child profile
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { id: true, name: true, preferredName: true, parentId: true },
  });

  if (!child) notFound();

  // Verify access
  const isParent = userRole === Role.PARENT && child.parentId === session.user.id;
  const isAdmin = userRole === Role.ADMIN;

  let isProfessional = false;
  if (userRole === Role.CLINICIAN || userRole === Role.SUPPORT) {
    const access = await prisma.childAccess.findFirst({
      where: {
        childId,
        professionalId: session.user.id,
        isActive: true,
      },
    });
    isProfessional = !!access;
  }

  if (!isParent && !isProfessional && !isAdmin) {
    redirect("/dashboard");
  }

  // Get game statistics
  const gameStats = await prisma.gameSession.groupBy({
    by: ["gameType"],
    where: { childId },
    _count: { id: true },
    _sum: { correctAnswers: true, attempts: true },
  });

  const statsMap = gameStats.reduce((acc, stat) => {
    acc[stat.gameType] = {
      sessions: stat._count.id,
      accuracy: stat._sum.attempts 
        ? Math.round(((stat._sum.correctAnswers || 0) / stat._sum.attempts) * 100)
        : 0,
    };
    return acc;
  }, {} as Record<string, { sessions: number; accuracy: number }>);

  const displayName = child.preferredName || child.name.split(" ")[0];

  const games = [
    {
      id: "emotion-match",
      name: "Emotion Match",
      description: "Recognize and match facial expressions with emotions",
      icon: "😊",
      color: "from-amber-400 to-orange-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      emotions: ["Happy", "Sad", "Angry", "Surprised"],
      gameType: "EMOTION_MATCH",
    },
    {
      id: "colors-shapes",
      name: "Colors & Shapes",
      description: "Match colors and shapes for visual attention training",
      icon: "🔴",
      color: "from-blue-400 to-purple-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      modes: ["Colors only", "Shapes only", "Combined"],
      gameType: "COLORS_SHAPES",
    },
    {
      id: "routine-sequence",
      name: "Routine Sequence",
      description: "Arrange daily routines in the correct order",
      icon: "📅",
      color: "from-teal-400 to-cyan-500",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      routines: ["Morning routine", "Bedtime routine", "Going to school"],
      gameType: "ROUTINE_SEQUENCE",
    },
    {
      id: "sound-match",
      name: "Sound Match",
      description: "Listen to sounds and match them with images",
      icon: "🔊",
      color: "from-pink-400 to-rose-500",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      sounds: ["Dog", "Cat", "Car", "Doorbell"],
      gameType: "SOUND_MATCH",
    },
    {
      id: "imitate-move",
      name: "Imitate the Move",
      description: "Watch a gesture and select the matching action",
      icon: "👋",
      color: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      gestures: ["Clapping hands", "Waving", "Raising arms", "Jumping"],
      gameType: "IMITATE_MOVE",
    },
  ];

  // Get recent sessions
  const recentSessions = await prisma.gameSession.findMany({
    where: { childId },
    orderBy: { playedAt: "desc" },
    take: 5,
  });

  const gameNames: Record<string, string> = {
    EMOTION_MATCH: "Emotion Match",
    COLORS_SHAPES: "Colors & Shapes",
    ROUTINE_SEQUENCE: "Routine Sequence",
    SOUND_MATCH: "Sound Match",
    IMITATE_MOVE: "Imitate the Move",
  };

  const gameIcons: Record<string, string> = {
    EMOTION_MATCH: "😊",
    COLORS_SHAPES: "🔴",
    ROUTINE_SEQUENCE: "📅",
    SOUND_MATCH: "🔊",
    IMITATE_MOVE: "👋",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/garden/${childId}`}
            className="text-sage-500 hover:text-sage-700 dark:hover:text-sage-300 flex items-center gap-1 text-sm mb-2"
          >
            <span className="material-symbols-rounded text-sm">arrow_back</span>
            Back to Garden
          </Link>
          <h1 className="text-2xl font-bold text-sage-900 dark:text-white">
            Games for {displayName}
          </h1>
          <p className="text-sage-600 dark:text-sage-400 mt-1">
            Fun activities for learning and development
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-lavender-400 to-purple-500 text-white text-2xl">
          🎮
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="mb-6 p-4 rounded-xl bg-sage-50 dark:bg-sage-800/50 border border-sage-200 dark:border-sage-700">
        <p className="text-xs text-sage-600 dark:text-sage-400">
          <strong>Note:</strong> These games are designed for cognitive stimulation and learning 
          support. They do not replace professional therapy, diagnosis, or treatment.
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid gap-4">
        {games.map((game) => {
          const stats = statsMap[game.gameType];
          
          return (
            <Link
              key={game.id}
              href={`/garden/${childId}/games/${game.id}`}
              className="card p-5 flex items-center gap-4 hover:shadow-md transition-all group"
            >
              <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${game.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform`}>
                {game.icon}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-sage-900 dark:text-white text-lg">
                  {game.name}
                </h3>
                <p className="text-sm text-sage-600 dark:text-sage-400">
                  {game.description}
                </p>
                
                {stats && (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-sage-500 dark:text-sage-400 flex items-center gap-1">
                      <span className="material-symbols-rounded text-sm">play_circle</span>
                      {stats.sessions} sessions
                    </span>
                    <span className="text-xs text-sage-500 dark:text-sage-400 flex items-center gap-1">
                      <span className="material-symbols-rounded text-sm">target</span>
                      {stats.accuracy}% accuracy
                    </span>
                  </div>
                )}
              </div>

              <span className="material-symbols-rounded text-sage-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all">
                chevron_right
              </span>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        
        {recentSessions.length === 0 ? (
          <div className="card p-6 text-center">
            <span className="text-4xl mb-3 block">🎯</span>
            <p className="text-sage-600 dark:text-sage-400">
              No games played yet. Start playing to see activity here!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const accuracy = session.attempts > 0
                ? Math.round((session.correctAnswers / session.attempts) * 100)
                : 0;

              return (
                <div
                  key={session.id}
                  className="card p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-800 flex items-center justify-center text-xl">
                    {gameIcons[session.gameType]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sage-900 dark:text-white">
                      {gameNames[session.gameType]}
                    </p>
                    <p className="text-xs text-sage-500 dark:text-sage-400">
                      {new Date(session.playedAt).toLocaleDateString()} • {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, "0")} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sage-900 dark:text-white">
                      {accuracy}%
                    </p>
                    <p className="text-xs text-sage-500">
                      {session.correctAnswers}/{session.attempts}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
