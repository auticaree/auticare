import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role as Role;
    let professionals;

    if (userRole === Role.PARENT) {
      // Get professionals who have access to any of the parent's children
      const children = await prisma.childProfile.findMany({
        where: { parentId: session.user.id },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);

      const accessRecords = await prisma.childAccess.findMany({
        where: {
          childId: { in: childIds },
          isActive: true,
        },
        select: {
          professional: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Deduplicate professionals
      const profMap = new Map();
      for (const record of accessRecords) {
        if (!profMap.has(record.professional.id)) {
          profMap.set(record.professional.id, record.professional);
        }
      }
      professionals = Array.from(profMap.values());
    } else if (userRole === Role.CLINICIAN || userRole === Role.SUPPORT) {
      // Professionals can schedule with other professionals on the same care teams
      const myAccess = await prisma.childAccess.findMany({
        where: {
          professionalId: session.user.id,
          isActive: true,
        },
        select: { childId: true },
      });
      const childIds = myAccess.map((a) => a.childId);

      const accessRecords = await prisma.childAccess.findMany({
        where: {
          childId: { in: childIds },
          isActive: true,
          professionalId: { not: session.user.id },
        },
        select: {
          professional: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      const profMap = new Map();
      for (const record of accessRecords) {
        if (!profMap.has(record.professional.id)) {
          profMap.set(record.professional.id, record.professional);
        }
      }
      professionals = Array.from(profMap.values());
    } else {
      // Admin can see all professionals
      professionals = await prisma.user.findMany({
        where: {
          role: { in: [Role.CLINICIAN, Role.SUPPORT] },
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }

    return NextResponse.json({ professionals });
  } catch (error) {
    console.error("Error fetching professionals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
