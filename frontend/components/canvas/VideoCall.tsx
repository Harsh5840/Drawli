"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone, Users, Maximize2, Minimize2 } from 'lucide-react';

interface Participant {
    id: string;
    name: string;
    stream: MediaStream | null;
    isMuted: boolean;
    isVideoOff: boolean;
}

interface VideoCallProps {
    socket: WebSocket | null;
    roomId: string;
    userId: string;
    userName: string;
    onClose: () => void;
}

// Generate random color for user
const getUserColor = (userId: string) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#a29bfe', '#fd79a8'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
};

// Individual video tile component
function VideoTile({ participant, isLocal, isMini }: { participant: Participant; isLocal?: boolean; isMini?: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);

    const initials = participant.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div
            className={`relative rounded-xl overflow-hidden ${isMini ? 'w-32 h-24' : 'w-full h-full'
                } bg-gray-900 border border-white/10`}
        >
            {participant.stream && !participant.isVideoOff ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: getUserColor(participant.id) + '20' }}
                >
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{ backgroundColor: getUserColor(participant.id) }}
                    >
                        {initials || '?'}
                    </div>
                </div>
            )}

            {/* Status indicators */}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-black/50 text-xs text-white">
                    {isLocal ? 'You' : participant.name}
                </span>
                {participant.isMuted && (
                    <span className="p-1 rounded bg-red-500/80">
                        <MicOff size={12} />
                    </span>
                )}
            </div>
        </div>
    );
}

export default function VideoCall({ socket, roomId, userId, userName, onClose }: VideoCallProps) {
    const [isInCall, setIsInCall] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

    // ICE servers configuration
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };

    // Start local media
    const startLocalMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('Failed to get media:', error);
            // Try audio only
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true,
                });
                setLocalStream(stream);
                setIsVideoOff(true);
                return stream;
            } catch (audioError) {
                console.error('Failed to get audio:', audioError);
                return null;
            }
        }
    };

    // Create peer connection for a remote user
    const createPeerConnection = useCallback((remoteUserId: string, remoteName: string) => {
        if (peerConnections.current.has(remoteUserId)) {
            return peerConnections.current.get(remoteUserId)!;
        }

        const pc = new RTCPeerConnection(iceServers);

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.send(JSON.stringify({
                    type: 'signal',
                    signalOp: {
                        targetUserId: remoteUserId,
                        type: 'candidate',
                        candidate: JSON.stringify(event.candidate),
                    },
                }));
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            setParticipants(prev => {
                const updated = new Map(prev);
                const existing = updated.get(remoteUserId);
                updated.set(remoteUserId, {
                    id: remoteUserId,
                    name: remoteName || remoteUserId,
                    stream: event.streams[0],
                    isMuted: existing?.isMuted || false,
                    isVideoOff: existing?.isVideoOff || false,
                });
                return updated;
            });
        };

        peerConnections.current.set(remoteUserId, pc);
        return pc;
    }, [localStream, socket]);

    // Join the call
    const joinCall = async () => {
        const stream = await startLocalMedia();
        if (!stream) return;

        setIsInCall(true);

        // Add self to participants
        setParticipants(new Map([[userId, {
            id: userId,
            name: userName,
            stream,
            isMuted: false,
            isVideoOff: false,
        }]]));

        // Notify others that we joined
        if (socket) {
            socket.send(JSON.stringify({
                type: 'call_join',
                roomId,
                userId,
                userName,
            }));
        }
    };

    // Leave the call
    const leaveCall = () => {
        // Stop local media
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // Close all peer connections
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();

        setLocalStream(null);
        setParticipants(new Map());
        setIsInCall(false);

        // Notify others
        if (socket) {
            socket.send(JSON.stringify({
                type: 'call_leave',
                roomId,
                userId,
            }));
        }

        onClose();
    };

    // Toggle mute
    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted;
            });
            setIsMuted(!isMuted);
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = isVideoOff;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    // Handle signaling messages
    useEffect(() => {
        if (!socket || !isInCall) return;

        const handleMessage = async (event: MessageEvent) => {
            try {
                const data = JSON.parse(typeof event.data === 'string' ? event.data : await event.data.text());

                if (data.type === 'call_join' && data.userId !== userId) {
                    // Someone joined - send offer
                    const pc = createPeerConnection(data.userId, data.userName);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    socket.send(JSON.stringify({
                        type: 'signal',
                        signalOp: {
                            targetUserId: data.userId,
                            type: 'offer',
                            sdp: JSON.stringify(offer),
                        },
                    }));
                }

                if (data.type === 'signal' && data.signalOp) {
                    const signal = data.signalOp;

                    if (signal.type === 'offer') {
                        const pc = createPeerConnection(signal.fromUserId || 'unknown', 'Remote User');
                        await pc.setRemoteDescription(JSON.parse(signal.sdp));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        socket.send(JSON.stringify({
                            type: 'signal',
                            signalOp: {
                                targetUserId: signal.fromUserId,
                                type: 'answer',
                                sdp: JSON.stringify(answer),
                            },
                        }));
                    }

                    if (signal.type === 'answer') {
                        const pc = peerConnections.current.get(signal.fromUserId);
                        if (pc) {
                            await pc.setRemoteDescription(JSON.parse(signal.sdp));
                        }
                    }

                    if (signal.type === 'candidate') {
                        const pc = peerConnections.current.get(signal.fromUserId);
                        if (pc) {
                            await pc.addIceCandidate(JSON.parse(signal.candidate));
                        }
                    }
                }

                if (data.type === 'call_leave') {
                    // Someone left
                    const pc = peerConnections.current.get(data.userId);
                    if (pc) {
                        pc.close();
                        peerConnections.current.delete(data.userId);
                    }
                    setParticipants(prev => {
                        const updated = new Map(prev);
                        updated.delete(data.userId);
                        return updated;
                    });
                }
            } catch (error) {
                // Not a JSON message or not for us
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket, isInCall, userId, createPeerConnection]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            peerConnections.current.forEach(pc => pc.close());
        };
    }, [localStream]);

    const participantArray = Array.from(participants.values());

    // Not in call - show join button
    if (!isInCall) {
        return (
            <div className="fixed bottom-20 right-4 z-50">
                <button
                    onClick={joinCall}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium shadow-lg hover:shadow-green-500/25 transition-all"
                >
                    <Video size={20} />
                    Start Video Call
                </button>
            </div>
        );
    }

    return (
        <div
            className={`fixed z-50 transition-all duration-300 ${isExpanded
                    ? 'inset-4 md:inset-8'
                    : 'bottom-20 right-4 w-80 h-60'
                }`}
        >
            <div className="w-full h-full glass rounded-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-green-400" />
                        <span className="text-sm text-gray-300">
                            {participantArray.length} in call
                        </span>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>

                {/* Video Grid */}
                <div className="flex-1 p-2 overflow-auto">
                    <div
                        className={`grid gap-2 h-full ${participantArray.length === 1
                                ? 'grid-cols-1'
                                : participantArray.length <= 4
                                    ? 'grid-cols-2'
                                    : 'grid-cols-3'
                            }`}
                    >
                        {participantArray.map((p) => (
                            <VideoTile
                                key={p.id}
                                participant={{
                                    ...p,
                                    isMuted: p.id === userId ? isMuted : p.isMuted,
                                    isVideoOff: p.id === userId ? isVideoOff : p.isVideoOff,
                                }}
                                isLocal={p.id === userId}
                            />
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 p-3 border-t border-white/10">
                    <button
                        onClick={toggleMute}
                        className={`p-3 rounded-full transition-colors ${isMuted
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full transition-colors ${isVideoOff
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                    >
                        {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                    <button
                        onClick={leaveCall}
                        className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                        <PhoneOff size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
