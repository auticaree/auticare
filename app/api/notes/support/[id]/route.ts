import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportNoteSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { Role, AuditAction } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = session.user.role as Role;

    // Only professionals can view support notes
    if (userRole !== Role.SUPPORT && userRole !== Role.CLINICIAN && userRole !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const note = await prisma.supportNote.findUnique({
      where: { id },
      include: {
        child: { select: { id: true, name: true } },
        author: { select: { id: true, name: true, role: true } },
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Verify access
    if (userRole !== Role.ADMIN) {
      const hasAccess = await prisma.childAccess.findFirst({
        where: {
          childId: note.childId,
          professionalId: session.user.id,
          isActive: true,
        },
      });

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error fetching support note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = session.user.role as Role;

    // Find the note
    const existingNote = await prisma.supportNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author can edit (or admin)
    if (existingNote.authorId !== session.user.id && userRole !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only the author can edit this note" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = supportNoteSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      sessionSummary,
      goals,
      interventions,
      observations,
      progress,
      homePractice,
    } = validation.data;

    const note = await prisma.supportNote.update({
      where: { id },
      data: {
        ...(sessionSummary !== undefined && { sessionSummary }),
        ...(goals !== undefined && { goals }),
        ...(interventions !== undefined && { interventions }),
        ...(observations !== undefined && { observations }),
        ...(progress !== undefined && { progress }),
        ...(homePractice !== undefined && { homePractice }),
      },
      include: {
        child: { select: { id: true, name: true } },
        author: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await createAuditLog({
      action: AuditAction.NOTE_UPDATED,
      userId: session.user.id,
      targetId: note.id,
      targetType: "SupportNote",
      metadata: { childId: note.childId },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error updating support note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = session.user.role as Role;

    // Find the note
    const existingNote = await prisma.supportNote.findUnique({
      where: { id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the author can delete (or admin)
    if (existingNote.authorId !== session.user.id && userRole !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only the author can delete this note" },
        { status: 403 }
      );
    }

    await prisma.supportNote.delete({
      where: { id },
    });

    // Audit log
    await createAuditLog({
      action: AuditAction.NOTE_DELETED,
      userId: session.user.id,
      targetId: id,
      targetType: "SupportNote",
      metadata: { childId: existingNote.childId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting support note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
