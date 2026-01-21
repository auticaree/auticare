import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find token in database (using prefix pattern)
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: tokenHash,
        identifier: { startsWith: "password-reset:" },
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Extract user ID from identifier
    const userId = verificationToken.identifier.replace("password-reset:", "");

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: tokenHash,
        },
      },
    });

    // Log the password reset
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PASSWORD_RESET",
        targetType: "User",
        targetId: userId,
        metadata: JSON.stringify({ timestamp: new Date().toISOString() }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

// GET /api/auth/reset-password?token=xxx - Validate token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "No token provided" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: tokenHash,
        identifier: { startsWith: "password-reset:" },
        expires: { gt: new Date() },
      },
    });

    return NextResponse.json({
      valid: !!verificationToken,
      expiresAt: verificationToken?.expires,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" });
  }
}
