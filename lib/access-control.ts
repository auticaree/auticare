import { prisma } from "@/lib/prisma";
import { PermissionScope, Role } from "@prisma/client";

/**
 * Check if a user has access to a child profile
 */
export async function hasAccessToChild(
  userId: string,
  childId: string,
  requiredScope?: PermissionScope
): Promise<boolean> {
  // Get user with their role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) return false;

  // Admins have access for management (but not patient data directly)
  if (user.role === Role.ADMIN) {
    return false; // Admins need explicit grants too for patient data
  }

  // Check if user is the parent of this child
  const childProfile = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { parentId: true },
  });

  if (childProfile?.parentId === userId) {
    return true; // Parent always has access to their own child
  }

  // Check for explicit access grant
  const access = await prisma.childAccess.findUnique({
    where: {
      childId_professionalId: {
        childId,
        professionalId: userId,
      },
    },
    select: {
      isActive: true,
      scopes: true,
    },
  });

  if (!access || !access.isActive) {
    return false;
  }

  // If a specific scope is required, check for it
  if (requiredScope && !access.scopes.includes(requiredScope)) {
    return false;
  }

  return true;
}

/**
 * Get all children a user has access to
 */
export async function getAccessibleChildren(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return [];

  // If parent, get their own children
  if (user.role === Role.PARENT) {
    return prisma.childProfile.findMany({
      where: { parentId: userId },
      include: {
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
    });
  }

  // If professional, get children they have access to
  if (user.role === Role.CLINICIAN || user.role === Role.SUPPORT) {
    const accessGrants = await prisma.childAccess.findMany({
      where: {
        professionalId: userId,
        isActive: true,
      },
      include: {
        child: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return accessGrants.map((grant) => ({
      ...grant.child,
      accessScopes: grant.scopes,
    }));
  }

  return [];
}

/**
 * Get professionals with access to a child
 */
export async function getChildProfessionals(childId: string) {
  return prisma.childAccess.findMany({
    where: {
      childId,
      isActive: true,
    },
    include: {
      professional: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
        },
      },
    },
  });
}

/**
 * Grant access to a professional
 */
export async function grantAccess(
  childId: string,
  professionalId: string,
  scopes: PermissionScope[]
) {
  return prisma.childAccess.upsert({
    where: {
      childId_professionalId: {
        childId,
        professionalId,
      },
    },
    update: {
      scopes,
      isActive: true,
      revokedAt: null,
    },
    create: {
      childId,
      professionalId,
      scopes,
    },
  });
}

/**
 * Revoke access from a professional
 */
export async function revokeAccess(childId: string, professionalId: string) {
  return prisma.childAccess.update({
    where: {
      childId_professionalId: {
        childId,
        professionalId,
      },
    },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });
}
