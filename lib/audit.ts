import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

interface AuditLogParams {
  userId: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog({
  userId,
  action,
  targetType,
  targetId,
  metadata,
  ipAddress,
  userAgent,
}: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent,
    },
  });
}

export async function getAuditLogs(options: {
  userId?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  limit?: number;
  offset?: number;
}) {
  const { userId, action, targetType, targetId, limit = 50, offset = 0 } = options;

  return prisma.auditLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(targetType && { targetType }),
      ...(targetId && { targetId }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}
