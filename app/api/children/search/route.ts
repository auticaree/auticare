import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Search for children by name (for professionals to request access)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Only professionals can search for children
    if (!user || !["CLINICIAN", "SUPPORT", "ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only healthcare professionals can search for patients" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search for children by name (case-insensitive)
    const children = await prisma.childProfile.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
        // Exclude children the professional already has access to
        NOT: {
          accessList: {
            some: {
              professionalId: session.user.id,
              isActive: true,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        parent: {
          select: {
            name: true,
          },
        },
      },
      take: 10,
    });

    return NextResponse.json({
      children: children.map((c) => ({
        id: c.id,
        name: c.name,
        parentName: c.parent.name,
      })),
    });
  } catch (error) {
    console.error("Error searching children:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
