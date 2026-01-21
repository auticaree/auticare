import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVideoHealth, preflightCheck } from "@/lib/video-provider";

// GET - Check video service health status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [health, preflight] = await Promise.all([
      getVideoHealth(),
      preflightCheck(),
    ]);

    return NextResponse.json({
      status: preflight.ready ? "ready" : "not_configured",
      health,
      preflight,
      message: preflight.ready
        ? "Video service is configured and ready"
        : "Video service is not fully configured. Check environment variables.",
    });
  } catch (error) {
    console.error("Error checking video health:", error);
    return NextResponse.json(
      { error: "Failed to check video service health" },
      { status: 500 }
    );
  }
}
