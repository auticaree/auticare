import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const prescriptionSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  instructions: z.string().optional(),
  prescribedBy: z.string().optional(),
  pharmacy: z.string().optional(),
  status: z.enum(["ACTIVE", "PAUSED", "DISCONTINUED", "COMPLETED"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  refillDate: z.string().datetime().optional(),
  sideEffectsNoted: z.string().optional(),
});

// GET /api/children/[id]/prescriptions - List prescriptions for a child
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

    if (child.parentId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const whereClause: Record<string, unknown> = { childId: id };
    if (status) {
      whereClause.status = status;
    } else if (activeOnly) {
      whereClause.status = "ACTIVE";
    }

    const prescriptions = await prisma.prescription.findMany({
      where: whereClause,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: {
        addedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}

// POST /api/children/[id]/prescriptions - Create a prescription
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
    const result = prescriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name,
      dosage,
      frequency,
      instructions,
      prescribedBy,
      pharmacy,
      status,
      startDate,
      endDate,
      refillDate,
      sideEffectsNoted,
    } = result.data;

    const prescription = await prisma.prescription.create({
      data: {
        childId: id,
        addedById: session.user.id,
        name,
        dosage,
        frequency,
        instructions,
        prescribedBy,
        pharmacy,
        status: status || "ACTIVE",
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        refillDate: refillDate ? new Date(refillDate) : null,
        sideEffectsNoted,
      },
      include: {
        addedBy: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json(
      { error: "Failed to create prescription" },
      { status: 500 }
    );
  }
}
