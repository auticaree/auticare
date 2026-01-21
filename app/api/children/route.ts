import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { childProfileSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

// GET - List children for parent
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = session;

    // Parents see their own children
    if (user.role === Role.PARENT) {
      const children = await prisma.childProfile.findMany({
        where: { parentId: user.id },
        include: {
          gardenProgress: true,
          accessList: {
            where: { isActive: true },
            include: {
              professional: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ children });
    }

    // Professionals see children they have access to
    if (user.role === Role.CLINICIAN || user.role === Role.SUPPORT) {
      const accessGrants = await prisma.childAccess.findMany({
        where: {
          professionalId: user.id,
          isActive: true,
        },
        include: {
          child: {
            include: {
              parent: {
                select: { id: true, name: true, email: true },
              },
              gardenProgress: true,
            },
          },
        },
        orderBy: { grantedAt: "desc" },
      });

      const children = accessGrants.map((grant) => ({
        ...grant.child,
        accessScopes: grant.scopes,
      }));

      return NextResponse.json({ children });
    }

    return NextResponse.json({ children: [] });
  } catch (error) {
    console.error("Error fetching children:", error);
    return NextResponse.json(
      { error: "Failed to fetch children" },
      { status: 500 }
    );
  }
}

// POST - Create child profile (parents only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== Role.PARENT) {
      return NextResponse.json(
        { error: "Only parents can create child profiles" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = childProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, dateOfBirth, timezone, notes } = validationResult.data;

    // Create child profile with garden
    const child = await prisma.childProfile.create({
      data: {
        name,
        dateOfBirth: new Date(dateOfBirth),
        timezone,
        notes,
        parentId: session.user.id!,
        gardenProgress: {
          create: {
            plantLevel: 1,
            growthPoints: 0,
            totalPoints: 100,
            tasksCompleted: 0,
          },
        },
      },
      include: {
        gardenProgress: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id!,
      action: "RECORD_CREATED",
      targetType: "ChildProfile",
      targetId: child.id,
      metadata: { childName: name },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      { message: "Child profile created", child },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating child profile:", error);
    return NextResponse.json(
      { error: "Failed to create child profile" },
      { status: 500 }
    );
  }
}
