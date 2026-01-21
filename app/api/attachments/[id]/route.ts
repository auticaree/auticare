import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get attachment with message and thread info
        const attachment = await prisma.attachment.findUnique({
            where: { id },
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
                { error: "Not authorized to download this attachment" },
                { status: 403 }
            );
        }

        // Check if file exists
        const fullPath = path.join(process.cwd(), "uploads", attachment.storagePath);
        if (!existsSync(fullPath)) {
            return NextResponse.json({ error: "File not found on server" }, { status: 404 });
        }

        // Read file
        const fileBuffer = await readFile(fullPath);

        // Audit log
        await createAuditLog({
            userId: session.user.id,
            action: AuditAction.RECORD_VIEWED,
            targetType: "Attachment",
            targetId: attachment.id,
            metadata: {
                fileName: attachment.fileName,
                action: "download",
            },
        });

        // Return file as download
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": attachment.fileType,
                "Content-Disposition": `attachment; filename="${encodeURIComponent(
                    attachment.fileName
                )}"`,
                "Content-Length": String(attachment.fileSize),
            },
        });
    } catch (error) {
        console.error("Error downloading attachment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE - Delete attachment (only sender or admin)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Get attachment
        const attachment = await prisma.attachment.findUnique({
            where: { id },
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

        // Only sender or admin can delete
        if (
            attachment.uploadedBy !== session.user.id &&
            session.user.role !== "ADMIN"
        ) {
            return NextResponse.json(
                { error: "Not authorized to delete this attachment" },
                { status: 403 }
            );
        }

        // Delete from database
        await prisma.attachment.delete({
            where: { id },
        });

        // Audit log
        await createAuditLog({
            userId: session.user.id,
            action: AuditAction.RECORD_DELETED,
            targetType: "Attachment",
            targetId: id,
            metadata: {
                fileName: attachment.fileName,
            },
        });

        // Note: In production, also delete the file from storage

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting attachment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
