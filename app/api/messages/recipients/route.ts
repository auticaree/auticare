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
    let recipients: { id: string; name: string | null; role: Role; childName?: string }[] = [];

    if (userRole === Role.PARENT) {
      // Parents can message professionals who have access to their children
      const children = await prisma.childProfile.findMany({
        where: { parentId: session.user.id },
        select: {
          id: true,
          name: true,
          accessList: {
            where: { isActive: true },
            select: {
              professional: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      });

      const profMap = new Map();
      for (const child of children) {
        for (const access of child.accessList) {
          const prof = access.professional;
          if (!profMap.has(prof.id)) {
            profMap.set(prof.id, { ...prof, childName: child.name });
          }
        }
      }
      recipients = Array.from(profMap.values());
    } else if (userRole === Role.CLINICIAN || userRole === Role.SUPPORT) {
      // Professionals can message parents and other professionals on the same care teams
      const myAccess = await prisma.childAccess.findMany({
        where: {
          professionalId: session.user.id,
          isActive: true,
        },
        select: {
          child: {
            select: {
              id: true,
              name: true,
              parent: {
                select: { id: true, name: true, role: true },
              },
              accessList: {
                where: {
                  isActive: true,
                  professionalId: { not: session.user.id },
                },
                select: {
                  professional: {
                    select: { id: true, name: true, role: true },
                  },
                },
              },
            },
          },
        },
      });

      const recipientMap = new Map();
      for (const access of myAccess) {
        // Add parent
        const parent = access.child.parent;
        if (!recipientMap.has(parent.id)) {
          recipientMap.set(parent.id, { ...parent, childName: access.child.name });
        }

        // Add other professionals
        for (const otherAccess of access.child.accessList) {
          const prof = otherAccess.professional;
          if (!recipientMap.has(prof.id)) {
            recipientMap.set(prof.id, { ...prof, childName: access.child.name });
          }
        }
      }
      recipients = Array.from(recipientMap.values());
    } else if (userRole === Role.ADMIN) {
      // Admins can message anyone
      recipients = await prisma.user.findMany({
        where: { id: { not: session.user.id } },
        select: { id: true, name: true, role: true },
        take: 100,
      });
    }

    return NextResponse.json({
      recipients: recipients.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        childName: "childName" in r ? r.childName : undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching recipients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
