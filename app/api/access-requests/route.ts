import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

// GET - List access requests for the current user
// Professionals see their outgoing requests, Parents see incoming requests for their children
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const childId = searchParams.get("childId");

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parents see incoming requests for their children
    if (user.role === "PARENT") {
      const whereClause: Record<string, unknown> = {
        child: { parentId: session.user.id },
      };
      if (status) whereClause.status = status;
      if (childId) whereClause.childId = childId;

      const requests = await prisma.accessRequest.findMany({
        where: whereClause,
        include: {
          child: {
            select: { id: true, name: true },
          },
          professional: {
            select: { id: true, name: true, email: true, role: true, licenseNumber: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ requests, role: "PARENT" });
    }

    // Professionals see their outgoing requests
    if (user.role === "CLINICIAN" || user.role === "SUPPORT") {
      const whereClause: Record<string, unknown> = {
        professionalId: session.user.id,
      };
      if (status) whereClause.status = status;
      if (childId) whereClause.childId = childId;

      const requests = await prisma.accessRequest.findMany({
        where: whereClause,
        include: {
          child: {
            select: { id: true, name: true, parent: { select: { name: true, email: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ requests, role: user.role });
    }

    // Admins can see all requests
    if (user.role === "ADMIN") {
      const whereClause: Record<string, unknown> = {};
      if (status) whereClause.status = status;
      if (childId) whereClause.childId = childId;

      const requests = await prisma.accessRequest.findMany({
        where: whereClause,
        include: {
          child: {
            select: { id: true, name: true, parent: { select: { name: true, email: true } } },
          },
          professional: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ requests, role: "ADMIN" });
    }

    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  } catch (error) {
    console.error("Error fetching access requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new access request (professional only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    });

    // Only professionals can create access requests
    if (!user || !["CLINICIAN", "SUPPORT"].includes(user.role)) {
      return NextResponse.json(
        { error: "Only healthcare professionals can request access" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { childId, requestedScopes, message } = body;

    if (!childId || !requestedScopes || requestedScopes.length === 0) {
      return NextResponse.json(
        { error: "Child ID and at least one scope are required" },
        { status: 400 }
      );
    }

    // Verify the child exists
    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
      select: { id: true, name: true, parentId: true },
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        childId,
        professionalId: session.user.id,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending access request for this child" },
        { status: 400 }
      );
    }

    // Check if already has access
    const existingAccess = await prisma.childAccess.findFirst({
      where: {
        childId,
        professionalId: session.user.id,
        isActive: true,
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        { error: "You already have access to this child's records" },
        { status: 400 }
      );
    }

    // Create the access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        childId,
        professionalId: session.user.id,
        requestedScopes,
        message: message || null,
      },
      include: {
        child: {
          select: { name: true },
        },
      },
    });

    // Audit log
    await createAuditLog({
      userId: session.user.id,
      action: "ACCESS_REQUESTED",
      targetType: "ChildProfile",
      targetId: childId,
      metadata: {
        requestId: accessRequest.id,
        childName: child.name,
        requestedScopes,
      },
    });

    return NextResponse.json({
      success: true,
      request: accessRequest,
      message: "Access request submitted successfully"
    });
  } catch (error) {
    console.error("Error creating access request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
