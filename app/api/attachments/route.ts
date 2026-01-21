import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Allowed file types and max size (5MB)
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const messageId = formData.get("messageId") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!messageId) {
            return NextResponse.json(
                { error: "Message ID required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    error: "File type not allowed",
                    allowedTypes: ALLOWED_TYPES,
                },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: "File too large",
                    maxSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
                },
                { status: 400 }
            );
        }

        // Verify message exists and user is the sender
        const message = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
                thread: {
                    include: {
                        participants: { select: { userId: true } },
                    },
                },
            },
        });

        if (!message) {
            return NextResponse.json({ error: "Message not found" }, { status: 404 });
        }

        // Check if user is participant in the thread
        const isParticipant = message.thread.participants.some(
            (p) => p.userId === session.user!.id
        );

        if (!isParticipant) {
            return NextResponse.json(
                { error: "Not authorized to attach files to this message" },
                { status: 403 }
            );
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), "uploads", "attachments");
        if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = path.extname(file.name);
        const uniqueFileName = `${randomUUID()}${fileExtension}`;
        const storagePath = path.join("attachments", uniqueFileName);
        const fullPath = path.join(process.cwd(), "uploads", storagePath);

        // Write file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(fullPath, buffer);

        // Create attachment record
        const attachment = await prisma.attachment.create({
            data: {
                messageId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                storagePath,
                uploadedBy: session.user.id,
            },
        });

        // Audit log
        await createAuditLog({
            userId: session.user.id,
            action: AuditAction.RECORD_CREATED,
            targetType: "Attachment",
            targetId: attachment.id,
            metadata: {
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
                messageId,
            },
        });

        return NextResponse.json({ attachment }, { status: 201 });
    } catch (error) {
        console.error("Error uploading attachment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET - Retrieve attachment (download)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const attachmentId = searchParams.get("id");

        if (!attachmentId) {
            return NextResponse.json(
                { error: "Attachment ID required" },
                { status: 400 }
            );
        }

        // Get attachment with message and thread info
        const attachment = await prisma.attachment.findUnique({
            where: { id: attachmentId },
            include: {
                message: {
                    include: {
                        thread: {
                            include: {
                                participants: { select: { userId: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!attachment) {
            return NextResponse.json(
                { error: "Attachment not found" },
                { status: 404 }
            );
        }

        // Check if user is participant in the thread
        const isParticipant = attachment.message.thread.participants.some(
            (p: { userId: string }) => p.userId === session.user!.id
        );

        if (!isParticipant && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Not authorized to access this attachment" },
                { status: 403 }
            );
        }

        // Audit log
        await createAuditLog({
            userId: session.user.id,
            action: AuditAction.RECORD_VIEWED,
            targetType: "Attachment",
            targetId: attachment.id,
            metadata: {
                fileName: attachment.fileName,
            },
        });

        // Return attachment metadata (actual file download would need separate handling)
        return NextResponse.json({ attachment });
    } catch (error) {
        console.error("Error retrieving attachment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
