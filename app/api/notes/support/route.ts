import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportNoteSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { Role, AuditAction } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    
    // Only professionals can access support notes
    if (userRole !== Role.SUPPORT && userRole !== Role.CLINICIAN && userRole !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    // Get accessible children
    const accessibleChildren = await prisma.childAccess.findMany({
      where: {
        professionalId: session.user.id,
        isActive: true,
      },
      select: { childId: true },
    });
    const childIds = accessibleChildren.map((a) => a.childId);

    // Build where clause
    const whereClause = childId && childIds.includes(childId)
      ? { childId }
      : userRole === Role.ADMIN
      ? {}
      : { childId: { in: childIds } };

    const notes = await prisma.supportNote.findMany({
      where: whereClause,
      include: {
        child: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching support notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    
    // Only support professionals (and clinicians/admins) can create support notes
    if (userRole !== Role.SUPPORT && userRole !== Role.CLINICIAN && userRole !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only support professionals can create support notes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = supportNoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      childId,
      sessionSummary,
      goals,
      interventions,
      observations,
      progress,
      homePractice,
    } = validation.data;

    // Verify access to child
    const hasAccess = await prisma.childAccess.findFirst({
      where: {
        childId,
        professionalId: session.user.id,
        isActive: true,
      },
    });

    if (!hasAccess && userRole !== Role.ADMIN) {
      return NextResponse.json(
        { error: "You don't have access to this patient" },
        { status: 403 }
      );
    }

    // Create the note
    const note = await prisma.supportNote.create({
      data: {
        childId,
        authorId: session.user.id,
        sessionSummary,
        goals,
        interventions,
        observations,
        progress,
        homePractice,
      },
      include: {
        child: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });

    // Create audit log
    await createAuditLog({
      action: AuditAction.NOTE_CREATED,
      userId: session.user.id,
      targetId: note.id,
      targetType: "SupportNote",
      metadata: { childId },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Error creating support note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
