/**
 * Game Sessions API
 * Manages therapeutic game sessions for children
 * Based on: Auti-2.md - Technical Specification – Simple Therapeutic Games (V1)
 * 
 * Games:
 * 1. EMOTION_MATCH - Emotion recognition
 * 2. COLORS_SHAPES - Visual attention and categorization
 * 3. ROUTINE_SEQUENCE - Organization and logical sequencing
 * 4. SOUND_MATCH - Auditory perception
 * 5. IMITATE_MOVE - Imitation and attention
 * 
 * Data stored per session:
 * - Child ID, Game ID, Date
 * - Number of attempts, correct responses, duration in seconds
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AuditAction, GameType, Role } from "@prisma/client";
import { z } from "zod";

// Validation schema for creating a game session
const createGameSessionSchema = z.object({
    gameType: z.nativeEnum(GameType),
    attempts: z.number().int().min(0),
    correctAnswers: z.number().int().min(0),
    duration: z.number().int().min(0), // Duration in seconds
    completed: z.boolean().default(true),
    metadata: z.object({
        mode: z.string().optional(),     // e.g., "colors_only", "shapes_only", "combined"
        difficulty: z.string().optional(), // e.g., "easy", "medium", "hard"
        routine: z.string().optional(),    // e.g., "morning", "bedtime", "school"
        emotions: z.array(z.string()).optional(),
        sounds: z.array(z.string()).optional(),
        gestures: z.array(z.string()).optional(),
    }).optional(),
});

// GET /api/children/[id]/games - Get game sessions for a child
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: childId } = await params;
        const userRole = session.user.role as Role;

        // Verify access to child
        const child = await prisma.childProfile.findUnique({
            where: { id: childId },
            select: { id: true, name: true, parentId: true },
        });

        if (!child) {
            return NextResponse.json({ error: "Child not found" }, { status: 404 });
        }

        // Check access permissions
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
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const gameType = searchParams.get("gameType") as GameType | null;
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build query filters
        const where: {
            childId: string;
            gameType?: GameType;
            playedAt?: { gte?: Date; lte?: Date };
        } = { childId };

        if (gameType && Object.values(GameType).includes(gameType)) {
            where.gameType = gameType;
        }

        if (startDate || endDate) {
            where.playedAt = {};
            if (startDate) where.playedAt.gte = new Date(startDate);
            if (endDate) where.playedAt.lte = new Date(endDate);
        }

        // Get game sessions with pagination
        const [sessions, total] = await Promise.all([
            prisma.gameSession.findMany({
                where,
                orderBy: { playedAt: "desc" },
                take: Math.min(limit, 100),
                skip: offset,
            }),
            prisma.gameSession.count({ where }),
        ]);

        // Calculate statistics by game type
        const stats = await prisma.gameSession.groupBy({
            by: ["gameType"],
            where: { childId },
            _count: { id: true },
            _sum: {
                attempts: true,
                correctAnswers: true,
                duration: true
            },
            _avg: {
                attempts: true,
                correctAnswers: true,
                duration: true
            },
        });

        // Transform stats into a more usable format
        const gameStats = stats.reduce((acc, stat) => {
            acc[stat.gameType] = {
                totalSessions: stat._count.id,
                totalAttempts: stat._sum.attempts || 0,
                totalCorrect: stat._sum.correctAnswers || 0,
                totalDuration: stat._sum.duration || 0,
                avgAttempts: Math.round((stat._avg.attempts || 0) * 10) / 10,
                avgCorrect: Math.round((stat._avg.correctAnswers || 0) * 10) / 10,
                avgDuration: Math.round((stat._avg.duration || 0) * 10) / 10,
                accuracy: stat._sum.attempts
                    ? Math.round(((stat._sum.correctAnswers || 0) / stat._sum.attempts) * 100)
                    : 0,
            };
            return acc;
        }, {} as Record<string, {
            totalSessions: number;
            totalAttempts: number;
            totalCorrect: number;
            totalDuration: number;
            avgAttempts: number;
            avgCorrect: number;
            avgDuration: number;
            accuracy: number;
        }>);

        return NextResponse.json({
            sessions: sessions.map((s) => ({
                ...s,
                metadata: s.metadata ? JSON.parse(s.metadata) : null,
            })),
            total,
            limit,
            offset,
            stats: gameStats,
        });
    } catch (error) {
        console.error("Get game sessions error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/children/[id]/games - Create a new game session
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: childId } = await params;
        const userRole = session.user.role as Role;

        // Verify access to child
        const child = await prisma.childProfile.findUnique({
            where: { id: childId },
            include: {
                gardenProgress: true,
            },
        });

        if (!child) {
            return NextResponse.json({ error: "Child not found" }, { status: 404 });
        }

        // Check access - parents or the child themselves (if they have access)
        const isParent = userRole === Role.PARENT && child.parentId === session.user.id;
        const isAdmin = userRole === Role.ADMIN;

        // For game sessions, we allow parents and admins to create
        // In a real app, children might also create sessions through a restricted interface
        if (!isParent && !isAdmin) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await req.json();
        const validatedData = createGameSessionSchema.parse(body);

        // Validate that correctAnswers <= attempts
        if (validatedData.correctAnswers > validatedData.attempts) {
            return NextResponse.json(
                { error: "Correct answers cannot exceed total attempts" },
                { status: 400 }
            );
        }

        // Create the game session
        const gameSession = await prisma.gameSession.create({
            data: {
                childId,
                gameType: validatedData.gameType,
                attempts: validatedData.attempts,
                correctAnswers: validatedData.correctAnswers,
                duration: validatedData.duration,
                completed: validatedData.completed,
                metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
            },
        });

        // Award XP to garden progress if session was completed
        if (validatedData.completed && child.gardenProgress) {
            const accuracy = validatedData.attempts > 0
                ? validatedData.correctAnswers / validatedData.attempts
                : 0;

            // Base XP: 10, bonus for accuracy
            const baseXP = 10;
            const accuracyBonus = Math.round(accuracy * 15); // Up to 15 bonus XP
            const totalXP = baseXP + accuracyBonus;

            await prisma.gardenProgress.update({
                where: { id: child.gardenProgress.id },
                data: {
                    growthPoints: {
                        increment: totalXP,
                    },
                },
            });
        }

        // Create audit log
        await createAuditLog({
            userId: session.user.id,
            action: AuditAction.RECORD_CREATED,
            targetType: "GameSession",
            targetId: gameSession.id,
            metadata: {
                childId,
                childName: child.name,
                gameType: validatedData.gameType,
                attempts: validatedData.attempts,
                correctAnswers: validatedData.correctAnswers,
                duration: validatedData.duration,
                accuracy: validatedData.attempts > 0
                    ? Math.round((validatedData.correctAnswers / validatedData.attempts) * 100)
                    : 0,
            },
        });

        return NextResponse.json({
            ...gameSession,
            metadata: validatedData.metadata || null,
        }, { status: 201 });
    } catch (error) {
        console.error("Create game session error:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid data", details: error.issues },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
