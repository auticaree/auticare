import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getActiveAlerts,
    getAllAlerts,
    resolveAlert,
    getHealthStatus,
} from "@/lib/monitoring";

// GET - Get system alerts and health status
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can access monitoring
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const view = searchParams.get("view") || "active"; // 'active' | 'all' | 'health'

        if (view === "health") {
            const health = await getHealthStatus();
            return NextResponse.json({ health });
        }

        const alerts = view === "all" ? getAllAlerts(100) : getActiveAlerts();
        const health = await getHealthStatus();

        return NextResponse.json({
            alerts,
            health,
            summary: {
                total: alerts.length,
                critical: alerts.filter((a) => a.level === "critical").length,
                errors: alerts.filter((a) => a.level === "error").length,
                warnings: alerts.filter((a) => a.level === "warn").length,
            },
        });
    } catch (error) {
        console.error("Error fetching monitoring data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST - Resolve an alert
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can resolve alerts
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { alertId, action } = body;

        if (!alertId) {
            return NextResponse.json(
                { error: "Alert ID required" },
                { status: 400 }
            );
        }

        if (action === "resolve") {
            const success = resolveAlert(alertId, session.user.id!);
            if (success) {
                return NextResponse.json({ success: true, message: "Alert resolved" });
            }
            return NextResponse.json({ error: "Alert not found" }, { status: 404 });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Error resolving alert:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
