import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const result = forgotPasswordSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        const { email } = result.data;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                success: true,
                message: "If an account exists with this email, a reset link has been sent.",
            });
        }

        // Generate secure token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        // Delete any existing reset tokens for this user
        await prisma.verificationToken.deleteMany({
            where: { identifier: `password-reset:${user.id}` },
        });

        // Create new reset token
        await prisma.verificationToken.create({
            data: {
                identifier: `password-reset:${user.id}`,
                token: tokenHash,
                expires: expiresAt,
            },
        });

        // Send email
        await sendPasswordResetEmail({
            recipientEmail: user.email,
            recipientName: user.name,
            resetToken,
            expiresAt,
        });

        return NextResponse.json({
            success: true,
            message: "If an account exists with this email, a reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
