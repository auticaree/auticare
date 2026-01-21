import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const symptomLogSchema = z.object({
    symptomType: z.string().min(1),
    severity: z.enum(["MILD", "MODERATE", "SEVERE"]),
    notes: z.string().optional(),
    triggers: z.array(z.string()).optional(),
    duration: z.number().optional(),
    occurredAt: z.string().datetime().optional(),
});

// GET /api/children/[id]/symptoms - List symptom logs for a child
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify access to child
        const child = await prisma.childProfile.findUnique({
            where: { id },
        });

        if (!child) {
            return NextResponse.json({ error: "Child not found" }, { status: 404 });
        }

        // Only parent can access
        if (child.parentId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const whereClause: Record<string, unknown> = { childId: id };
        if (startDate || endDate) {
            whereClause.occurredAt = {};
            if (startDate) (whereClause.occurredAt as Record<string, Date>).gte = new Date(startDate);
            if (endDate) (whereClause.occurredAt as Record<string, Date>).lte = new Date(endDate);
        }

        const [symptoms, total] = await Promise.all([
            prisma.symptomLog.findMany({
                where: whereClause,
                orderBy: { occurredAt: "desc" },
                take: limit,
                skip: offset,
                include: {
                    loggedBy: {
                        select: { name: true },
                    },
                },
            }),
            prisma.symptomLog.count({ where: whereClause }),
        ]);

        return NextResponse.json({ symptoms, total });
    } catch (error) {
        console.error("Error fetching symptom logs:", error);
        return NextResponse.json(
            { error: "Failed to fetch symptom logs" },
            { status: 500 }
        );
    }
}

// POST /api/children/[id]/symptoms - Create a symptom log
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify access to child
        const child = await prisma.childProfile.findUnique({
            where: { id },
        });

        if (!child) {
            return NextResponse.json({ error: "Child not found" }, { status: 404 });
        }

        if (child.parentId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const result = symptomLogSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid request", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { symptomType, severity, notes, triggers, duration, occurredAt } = result.data;

        const symptomLog = await prisma.symptomLog.create({
            data: {
                childId: id,
                loggedById: session.user.id,
                symptomType,
                severity,
                notes,
                triggers: triggers || [],
                duration,
                occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
            },
            include: {
                loggedBy: {
                    select: { name: true },
                },
            },
        });

        return NextResponse.json(symptomLog, { status: 201 });
    } catch (error) {
        console.error("Error creating symptom log:", error);
        return NextResponse.json(
            { error: "Failed to create symptom log" },
            { status: 500 }
        );
    }
}
