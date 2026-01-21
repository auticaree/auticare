/**
 * Video provider configuration and helpers for AutiCare
 * Supports LiveKit for video conferencing with TURN/STUN fallback
 */

import { AccessToken } from "livekit-server-sdk";

// Environment variables for video provider
export const VIDEO_CONFIG = {
    apiKey: process.env.LIVEKIT_API_KEY,
    apiSecret: process.env.LIVEKIT_API_SECRET,
    wsUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL,
    // TURN/STUN servers for NAT traversal
    turnServers: process.env.TURN_SERVERS?.split(",").map((s) => s.trim()) || [],
    stunServers: process.env.STUN_SERVERS?.split(",").map((s) => s.trim()) || [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
    ],
};

export interface VideoTokenOptions {
    identity: string;
    name: string;
    roomName: string;
    ttl?: string;
    canPublish?: boolean;
    canSubscribe?: boolean;
}

/**
 * Check if video service is properly configured
 */
export function isVideoConfigured(): boolean {
    return !!(VIDEO_CONFIG.apiKey && VIDEO_CONFIG.apiSecret && VIDEO_CONFIG.wsUrl);
}

/**
 * Get video service health status
 */
export async function getVideoHealth(): Promise<{
    configured: boolean;
    wsUrl: string | undefined;
    hasStunServers: boolean;
    hasTurnServers: boolean;
}> {
    return {
        configured: isVideoConfigured(),
        wsUrl: VIDEO_CONFIG.wsUrl,
        hasStunServers: VIDEO_CONFIG.stunServers.length > 0,
        hasTurnServers: VIDEO_CONFIG.turnServers.length > 0,
    };
}

/**
 * Generate a video room token for a participant
 */
export async function generateRoomToken(
    options: VideoTokenOptions
): Promise<string> {
    const { identity, name, roomName, ttl = "2h", canPublish = true, canSubscribe = true } = options;

    if (!VIDEO_CONFIG.apiKey || !VIDEO_CONFIG.apiSecret) {
        throw new Error("Video service not configured: missing API credentials");
    }

    const at = new AccessToken(VIDEO_CONFIG.apiKey, VIDEO_CONFIG.apiSecret, {
        identity,
        name,
        ttl,
    });

    at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish,
        canSubscribe,
        canPublishData: true,
    });

    return await at.toJwt();
}

/**
 * Generate a unique room name for a video visit
 */
export function generateRoomName(childId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `auticare-${childId.slice(0, 8)}-${timestamp}-${random}`;
}

/**
 * Get ICE servers configuration for WebRTC
 */
export function getIceServers(): RTCIceServer[] {
    const servers: RTCIceServer[] = [];

    // Add STUN servers
    if (VIDEO_CONFIG.stunServers.length > 0) {
        servers.push({
            urls: VIDEO_CONFIG.stunServers,
        });
    }

    // Add TURN servers if configured (format: turn:host:port?transport=udp)
    if (VIDEO_CONFIG.turnServers.length > 0) {
        const turnUser = process.env.TURN_USERNAME;
        const turnCred = process.env.TURN_CREDENTIAL;

        if (turnUser && turnCred) {
            servers.push({
                urls: VIDEO_CONFIG.turnServers,
                username: turnUser,
                credential: turnCred,
            });
        }
    }

    return servers;
}

/**
 * Preflight check for video visit readiness
 */
export interface VideoPreflightResult {
    ready: boolean;
    issues: string[];
}

export async function preflightCheck(): Promise<VideoPreflightResult> {
    const issues: string[] = [];

    if (!VIDEO_CONFIG.apiKey) {
        issues.push("LiveKit API key not configured");
    }
    if (!VIDEO_CONFIG.apiSecret) {
        issues.push("LiveKit API secret not configured");
    }
    if (!VIDEO_CONFIG.wsUrl) {
        issues.push("LiveKit WebSocket URL not configured");
    }

    return {
        ready: issues.length === 0,
        issues,
    };
}
