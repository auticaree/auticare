"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalParticipant,
  ConnectionState,
  DataPacket_Kind,
} from "livekit-client";

interface VisualAid {
  icon: string;
  label: string;
  action: string;
}

const visualAids: VisualAid[] = [
  { icon: "thumb_up", label: "Yes / Good", action: "yes" },
  { icon: "pan_tool", label: "Wait / Stop", action: "wait" },
  { icon: "sentiment_dissatisfied", label: "Not Okay", action: "not_okay" },
  { icon: "volume_up", label: "Too Loud", action: "loud" },
  { icon: "chat", label: "Type", action: "type" },
  { icon: "sentiment_satisfied", label: "Happy", action: "happy" },
  { icon: "help", label: "Question", action: "question" },
];

interface VideoRoomClientProps {
  visit: {
    id: string;
    roomName: string;
    duration: number;
    professionalName: string;
    childName: string;
  };
  isParent: boolean;
  userName: string;
}

export default function VideoRoomClient({ visit, isParent, userName }: VideoRoomClientProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showVisualAids, setShowVisualAids] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(visit.duration * 60);
  const [selectedAid, setSelectedAid] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null);
  const roomRef = useRef<Room | null>(null);

  // Handle remote track subscriptions
  const handleTrackSubscribed = useCallback(
    (
      track: RemoteTrackPublication["track"],
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (!track) return;

      if (track.kind === Track.Kind.Video) {
        track.attach(remoteVideoRef.current!);
        setRemoteParticipant(participant);
      } else if (track.kind === Track.Kind.Audio) {
        track.attach(remoteAudioRef.current!);
      }
    },
    []
  );

  const handleTrackUnsubscribed = useCallback(
    (
      track: RemoteTrackPublication["track"],
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (!track) return;
      track.detach();

      if (track.kind === Track.Kind.Video) {
        setRemoteParticipant(null);
      }
    },
    []
  );

  const handleParticipantDisconnected = useCallback(
    (participant: RemoteParticipant) => {
      if (remoteParticipant?.identity === participant.identity) {
        setRemoteParticipant(null);
      }
    },
    [remoteParticipant]
  );

  // Handle incoming data messages (visual aids from remote)
  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoder = new TextDecoder();
        const message = JSON.parse(decoder.decode(payload));
        if (message.type === "visual_aid") {
          setSelectedAid(message.action);
          setTimeout(() => setSelectedAid(null), 2000);
        }
      } catch (e) {
        console.error("Error parsing data message:", e);
      }
    },
    []
  );

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Connect to LiveKit room
  useEffect(() => {
    let room: Room | null = null;

    async function connectToRoom() {
      try {
        setIsConnecting(true);
        setConnectionError(null);

        // Fetch token from API
        const response = await fetch(`/api/video-visits/${visit.id}/token`, {
          method: "POST",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to get video token");
        }

        const { token, wsUrl } = await response.json();

        // Create and configure room
        room = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
          },
        });

        roomRef.current = room;

        // Set up event listeners
        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.DataReceived, handleDataReceived);
        room.on(RoomEvent.Disconnected, () => {
          setConnectionError("Disconnected from room");
        });

        // Connect to room
        await room.connect(wsUrl, token);

        // Enable camera and microphone
        await room.localParticipant.enableCameraAndMicrophone();

        // Attach local video to preview
        const localVideoTrack = room.localParticipant.getTrackPublication(
          Track.Source.Camera
        )?.track;
        if (localVideoTrack && localVideoRef.current) {
          localVideoTrack.attach(localVideoRef.current);
        }

        // Check for existing participants
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            if (publication.isSubscribed && publication.track) {
              handleTrackSubscribed(publication.track, publication, participant);
            }
          });
          setRemoteParticipant(participant);
        });

        setIsConnecting(false);
      } catch (error) {
        console.error("Error connecting to room:", error);
        setConnectionError(
          error instanceof Error ? error.message : "Failed to connect"
        );
        setIsConnecting(false);
      }
    }

    connectToRoom();

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [visit.id, handleTrackSubscribed, handleTrackUnsubscribed, handleParticipantDisconnected, handleDataReceived]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = async () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    router.push("/video");
  };

  const toggleMute = async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (roomRef.current) {
      await roomRef.current.localParticipant.setCameraEnabled(!isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const handleVisualAid = async (aid: VisualAid) => {
    setSelectedAid(aid.action);

    // Send visual aid to remote participant via data channel
    if (roomRef.current) {
      const encoder = new TextEncoder();
      const data = encoder.encode(
        JSON.stringify({ type: "visual_aid", action: aid.action })
      );
      await roomRef.current.localParticipant.publishData(data, {
        reliable: true,
      });
    }

    setTimeout(() => setSelectedAid(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#112116] flex flex-col overflow-hidden text-white/90">
      {/* Top Status Bar */}
      <header className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0 z-20">
        <Link
          href="/video"
          className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-rounded text-white/70">arrow_back_ios_new</span>
        </Link>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary-500 animate-pulse"></div>
            <h1 className="text-base font-semibold tracking-wide text-white">
              {isParent ? visit.professionalName : visit.childName}
            </h1>
          </div>
          <span className="text-xs font-medium text-white/50 tracking-widest uppercase">
            {formatTime(timeRemaining)} Remaining
          </span>
        </div>
        <button className="flex items-center justify-center size-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
          <span className="material-symbols-rounded text-white/70">signal_cellular_alt</span>
        </button>
      </header>

      {/* Main Video Area */}
      <main className="flex-1 relative flex flex-col p-4 gap-4 overflow-hidden">
        {/* Video Grid Container */}
        <div className="relative flex-1 w-full h-full rounded-3xl overflow-hidden bg-[#1a2e22] shadow-lg ring-1 ring-white/5">
          {/* Remote Video (Main View) */}
          <div className="absolute inset-0 bg-linear-to-br from-sage-800 to-sage-900 flex items-center justify-center">
            {/* Hidden audio element for remote audio */}
            <audio ref={remoteAudioRef} autoPlay />

            {/* Remote video element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${remoteParticipant ? "" : "hidden"}`}
            />

            {isConnecting ? (
              <div className="text-center">
                <span className="material-symbols-rounded text-6xl text-white/30 animate-pulse">
                  videocam
                </span>
                <p className="mt-4 text-white/50">Connecting to room...</p>
              </div>
            ) : connectionError ? (
              <div className="text-center">
                <span className="material-symbols-rounded text-6xl text-coral-400">
                  error
                </span>
                <p className="mt-4 text-coral-400">{connectionError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20"
                >
                  Retry
                </button>
              </div>
            ) : !remoteParticipant ? (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-bold text-white/60">
                    {(isParent ? visit.professionalName : visit.childName).charAt(0)}
                  </span>
                </div>
                <p className="text-white/50">Waiting for participant to join...</p>
              </div>
            ) : null}
            <div className="absolute inset-0 bg-linear-to-b from-[#112116]/60 via-transparent to-[#112116]/80 mix-blend-multiply pointer-events-none"></div>
          </div>

          {/* Self View (PIP) */}
          <div className="absolute top-4 right-4 w-28 aspect-3/4 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-gray-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isVideoOn ? "" : "hidden"}`}
            />
            {!isVideoOn && (
              <div className="w-full h-full flex items-center justify-center bg-sage-800">
                <span className="material-symbols-rounded text-3xl text-white/40">
                  videocam_off
                </span>
              </div>
            )}
            {/* Mic Status Indicator */}
            <div className="absolute bottom-2 left-2 size-6 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
              <span className="material-symbols-rounded text-white text-sm">
                {isMuted ? "mic_off" : "mic"}
              </span>
            </div>
          </div>

          {/* Visual Aid Display (when selected) */}
          {selectedAid && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 animate-fade-in">
              <div className="bg-primary-500/20 rounded-3xl p-12 border border-primary-500/30">
                <span className="material-symbols-rounded text-8xl text-primary-400">
                  {visualAids.find((a) => a.action === selectedAid)?.icon}
                </span>
                <p className="text-center mt-4 text-xl font-medium text-white">
                  {visualAids.find((a) => a.action === selectedAid)?.label}
                </p>
              </div>
            </div>
          )}

          {/* Room Label */}
          <div className="absolute bottom-4 left-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-medium text-white/90 border border-white/5">
              {visit.roomName || "Consultation Room"}
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Interface Area */}
      <div className="shrink-0 flex flex-col gap-4 pb-8 px-4 z-20">
        {/* Visual Aids Panel */}
        {showVisualAids && (
          <div className="w-full bg-[#1F2923]/90 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white tracking-wide">Visual Aids</h3>
                <span className="text-xs text-primary-500/80">Tap to express</span>
              </div>
              <button
                onClick={() => setShowVisualAids(false)}
                className="size-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60"
              >
                <span className="material-symbols-rounded text-sm">keyboard_arrow_down</span>
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {visualAids.map((aid) => (
                <button
                  key={aid.action}
                  onClick={() => handleVisualAid(aid)}
                  className="group flex flex-col items-center gap-2 min-w-18"
                >
                  <div className="size-14 rounded-2xl bg-[#2A3B30] group-hover:bg-primary-500/20 flex items-center justify-center transition-all duration-300 border border-white/5 group-active:scale-95">
                    <span className="material-symbols-rounded text-[#93c8a5] group-hover:text-primary-500 transition-colors text-3xl">
                      {aid.icon}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-white/60">{aid.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed Visual Aids Toggle */}
        {!showVisualAids && (
          <button
            onClick={() => setShowVisualAids(true)}
            className="w-full py-2 rounded-xl bg-[#1F2923]/60 backdrop-blur text-white/60 text-sm hover:bg-[#1F2923]/80 transition-colors border border-white/5"
          >
            <span className="material-symbols-rounded text-sm mr-2 align-middle">
              keyboard_arrow_up
            </span>
            Show Visual Aids
          </button>
        )}

        {/* Main Controls Bar */}
        <div className="flex items-center justify-between gap-4">
          {/* Utility Group */}
          <div className="flex-1 flex items-center justify-center gap-4 bg-[#232624] p-2 rounded-3xl shadow-lg border border-white/5">
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center justify-center size-12 rounded-2xl transition-all active:scale-95 ${
                isMuted
                  ? "bg-white/5 text-white/80 hover:bg-white/10"
                  : "bg-primary-500 text-[#112116]"
              }`}
            >
              <span className="material-symbols-rounded">
                {isMuted ? "mic_off" : "mic"}
              </span>
            </button>
            <button
              onClick={toggleVideo}
              className={`flex flex-col items-center justify-center size-12 rounded-2xl transition-all active:scale-95 ${
                !isVideoOn
                  ? "bg-white/5 text-white/80 hover:bg-white/10"
                  : "bg-primary-500 text-[#112116]"
              }`}
            >
              <span className="material-symbols-rounded">
                {isVideoOn ? "videocam" : "videocam_off"}
              </span>
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`flex flex-col items-center justify-center size-12 rounded-2xl transition-all active:scale-95 ${
                showChat
                  ? "bg-primary-500 text-[#112116]"
                  : "bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              <span className="material-symbols-rounded">forum</span>
            </button>
          </div>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 h-16 px-6 rounded-3xl bg-coral-500 text-white font-bold tracking-wide shadow-lg hover:bg-coral-600 active:translate-y-0.5 transition-all"
          >
            <span className="material-symbols-rounded">call_end</span>
            <span>End</span>
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {showChat && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#1a2e22]/95 backdrop-blur-xl border-l border-white/10 z-30 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center"
            >
              <span className="material-symbols-rounded text-white/60">close</span>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-center text-white/40 text-sm">No messages yet</p>
          </div>
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="size-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <span className="material-symbols-rounded text-[#112116]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
