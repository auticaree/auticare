/**
 * AutiCare Monitoring & Logging System
 *
 * Provides centralized logging for backend events, video sessions,
 * and critical errors. Surfaces errors in admin view.
 */

import { prisma } from "@/lib/prisma";

export enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error",
    CRITICAL = "critical",
}

export enum LogCategory {
    AUTH = "auth",
    API = "api",
    VIDEO = "video",
    DATABASE = "database",
    MESSAGING = "messaging",
    NOTES = "notes",
    SECURITY = "security",
    SYSTEM = "system",
}

export interface LogEntry {
    level: LogLevel;
    category: LogCategory;
    message: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
    error?: Error;
    timestamp?: Date;
}

export interface SystemAlert {
    id: string;
    level: LogLevel;
    category: LogCategory;
    message: string;
    metadata: Record<string, unknown>;
    resolved: boolean;
    createdAt: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
}

// In-memory alert storage (in production, use database or Redis)
const alerts: SystemAlert[] = [];

/**
 * Main logging function
 */
export async function log(entry: LogEntry): Promise<void> {
    const timestamp = entry.timestamp || new Date();
    const logData = {
        timestamp: timestamp.toISOString(),
        level: entry.level,
        category: entry.category,
        message: entry.message,
        userId: entry.userId,
        sessionId: entry.sessionId,
        metadata: entry.metadata,
        error: entry.error
            ? {
                name: entry.error.name,
                message: entry.error.message,
                stack: entry.error.stack,
            }
            : undefined,
    };

    // Console output based on level
    switch (entry.level) {
        case LogLevel.DEBUG:
            if (process.env.NODE_ENV === "development") {
                console.debug("[DEBUG]", logData);
            }
            break;
        case LogLevel.INFO:
            console.info("[INFO]", logData);
            break;
        case LogLevel.WARN:
            console.warn("[WARN]", logData);
            break;
        case LogLevel.ERROR:
            console.error("[ERROR]", logData);
            break;
        case LogLevel.CRITICAL:
            console.error("[CRITICAL]", logData);
            // Create alert for critical errors
            await createAlert(entry);
            break;
    }

    // Store error/critical logs in database for admin view
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL) {
        try {
            await storeLogEntry(entry, timestamp);
        } catch (err) {
            console.error("Failed to store log entry:", err);
        }
    }
}

/**
 * Store log entry in database
 */
async function storeLogEntry(entry: LogEntry, timestamp: Date): Promise<void> {
    // Using the AuditLog model for error storage with special action type
    // In production, consider a separate ErrorLog model
    try {
        await prisma.auditLog.create({
            data: {
                userId: entry.userId || "system",
                action: "RECORD_CREATED" as const, // Use existing enum
                targetType: `SystemLog:${entry.category}`,
                targetId: entry.level,
                metadata: JSON.stringify({
                    message: entry.message,
                    category: entry.category,
                    level: entry.level,
                    sessionId: entry.sessionId,
                    details: entry.metadata,
                    error: entry.error
                        ? {
                            name: entry.error.name,
                            message: entry.error.message,
                            stack: entry.error.stack,
                        }
                        : undefined,
                }),
                createdAt: timestamp,
            },
        });
    } catch {
        // Silently fail if userId doesn't exist - log to console only
        console.error("Failed to persist log entry to database");
    }
}

/**
 * Create system alert for critical errors
 */
async function createAlert(entry: LogEntry): Promise<void> {
    const alert: SystemAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        metadata: entry.metadata || {},
        resolved: false,
        createdAt: new Date(),
    };

    alerts.unshift(alert);

    // Keep only last 100 alerts in memory
    if (alerts.length > 100) {
        alerts.splice(100);
    }
}

/**
 * Get active alerts for admin view
 */
export function getActiveAlerts(): SystemAlert[] {
    return alerts.filter((a) => !a.resolved);
}

/**
 * Get all alerts for admin view
 */
export function getAllAlerts(limit = 50): SystemAlert[] {
    return alerts.slice(0, limit);
}

/**
 * Resolve an alert
 */
export function resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
        alert.resolved = true;
        alert.resolvedAt = new Date();
        alert.resolvedBy = resolvedBy;
        return true;
    }
    return false;
}

// ===========================================
// Convenience logging functions
// ===========================================

export const logger = {
    debug: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
        log({ level: LogLevel.DEBUG, category, message, metadata }),

    info: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
        log({ level: LogLevel.INFO, category, message, metadata }),

    warn: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
        log({ level: LogLevel.WARN, category, message, metadata }),

    error: (
        category: LogCategory,
        message: string,
        error?: Error,
        metadata?: Record<string, unknown>
    ) => log({ level: LogLevel.ERROR, category, message, error, metadata }),

    critical: (
        category: LogCategory,
        message: string,
        error?: Error,
        metadata?: Record<string, unknown>
    ) => log({ level: LogLevel.CRITICAL, category, message, error, metadata }),
};

// ===========================================
// Video session monitoring
// ===========================================

export interface VideoSessionEvent {
    type:
    | "session_created"
    | "participant_joined"
    | "participant_left"
    | "session_ended"
    | "connection_error"
    | "quality_degraded";
    visitId: string;
    participantId?: string;
    roomName?: string;
    metadata?: Record<string, unknown>;
}

export async function logVideoEvent(event: VideoSessionEvent): Promise<void> {
    const level =
        event.type === "connection_error" || event.type === "quality_degraded"
            ? LogLevel.WARN
            : LogLevel.INFO;

    await log({
        level,
        category: LogCategory.VIDEO,
        message: `Video event: ${event.type}`,
        metadata: {
            ...event,
            timestamp: new Date().toISOString(),
        },
    });
}

// ===========================================
// API request monitoring
// ===========================================

export interface ApiRequestLog {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
    error?: string;
}

export async function logApiRequest(request: ApiRequestLog): Promise<void> {
    const level =
        request.statusCode >= 500
            ? LogLevel.ERROR
            : request.statusCode >= 400
                ? LogLevel.WARN
                : LogLevel.INFO;

    await log({
        level,
        category: LogCategory.API,
        message: `${request.method} ${request.path} - ${request.statusCode} (${request.duration}ms)`,
        userId: request.userId,
        metadata: {
            method: request.method,
            path: request.path,
            statusCode: request.statusCode,
            duration: request.duration,
            error: request.error,
        },
    });
}

// ===========================================
// Security event monitoring
// ===========================================

export enum SecurityEventType {
    LOGIN_SUCCESS = "login_success",
    LOGIN_FAILURE = "login_failure",
    UNAUTHORIZED_ACCESS = "unauthorized_access",
    PERMISSION_DENIED = "permission_denied",
    SUSPICIOUS_ACTIVITY = "suspicious_activity",
    RATE_LIMITED = "rate_limited",
}

export interface SecurityEvent {
    type: SecurityEventType;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    resource?: string;
    details?: string;
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
    const level =
        event.type === SecurityEventType.SUSPICIOUS_ACTIVITY
            ? LogLevel.CRITICAL
            : event.type === SecurityEventType.UNAUTHORIZED_ACCESS ||
                event.type === SecurityEventType.PERMISSION_DENIED
                ? LogLevel.WARN
                : LogLevel.INFO;

    await log({
        level,
        category: LogCategory.SECURITY,
        message: `Security event: ${event.type}`,
        userId: event.userId,
        metadata: {
            type: event.type,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            resource: event.resource,
            details: event.details,
        },
    });
}

// ===========================================
// Database monitoring
// ===========================================

export async function logDatabaseError(
    operation: string,
    error: Error,
    metadata?: Record<string, unknown>
): Promise<void> {
    await log({
        level: LogLevel.ERROR,
        category: LogCategory.DATABASE,
        message: `Database error during ${operation}`,
        error,
        metadata,
    });
}

// ===========================================
// Health check utilities
// ===========================================

export interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    database: boolean;
    activeAlerts: number;
    uptime: number;
    timestamp: string;
}

const startTime = Date.now();

export async function getHealthStatus(): Promise<HealthStatus> {
    let databaseHealthy = false;

    try {
        await prisma.$queryRaw`SELECT 1`;
        databaseHealthy = true;
    } catch {
        databaseHealthy = false;
    }

    const activeAlertCount = getActiveAlerts().length;

    let status: "healthy" | "degraded" | "unhealthy";
    if (!databaseHealthy) {
        status = "unhealthy";
    } else if (activeAlertCount > 0) {
        status = "degraded";
    } else {
        status = "healthy";
    }

    return {
        status,
        database: databaseHealthy,
        activeAlerts: activeAlertCount,
        uptime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
    };
}
