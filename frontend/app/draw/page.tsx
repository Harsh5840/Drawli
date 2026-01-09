"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import CanvasEngine from "@/components/canvas/CanvasEngine";
import { Radio, Users, Copy, Check, X, Loader2 } from "lucide-react";
import { createRoom } from "@/actions/room";
import toast from "react-hot-toast";

export default function DrawPage() {
     const router = useRouter();
     const [isLive, setIsLive] = useState(false);
     const [isConnecting, setIsConnecting] = useState(false);
     const [socket, setSocket] = useState<WebSocket | null>(null);
     const [roomSlug, setRoomSlug] = useState<string | null>(null);
     const [copied, setCopied] = useState(false);
     const [showLivePanel, setShowLivePanel] = useState(false);

     // Generate stable user credentials
     const { userId, userName } = useMemo(() => {
          let storedUserId = typeof window !== 'undefined' ? localStorage.getItem('drawli_userId') : null;
          let storedUserName = typeof window !== 'undefined' ? localStorage.getItem('drawli_userName') : null;

          if (!storedUserId) {
               storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
               if (typeof window !== 'undefined') {
                    localStorage.setItem('drawli_userId', storedUserId);
               }
          }

          if (!storedUserName) {
               storedUserName = `Guest ${Math.floor(Math.random() * 1000)}`;
               if (typeof window !== 'undefined') {
                    localStorage.setItem('drawli_userName', storedUserName);
               }
          }

          return { userId: storedUserId, userName: storedUserName };
     }, []);

     // Go Live - Create room and connect WebSocket
     const handleGoLive = async () => {
          setIsConnecting(true);

          try {
               // Check if user is logged in
               const token = localStorage.getItem('token');
               if (!token) {
                    toast.error('Please sign in to go live');
                    router.push('/signin');
                    return;
               }

               // Create a new room
               const roomName = `Live Session ${new Date().toLocaleTimeString()}`;
               const success = await createRoom({ name: roomName });

               if (!success) {
                    throw new Error('Failed to create room');
               }

               // For now, generate a slug (in production, get from API response)
               const slug = `live_${Date.now().toString(36)}`;
               setRoomSlug(slug);

               // Connect to WebSocket
               const jwt = token.includes(' ') ? token.split(' ')[1] : token;
               const ws = new WebSocket(`ws://localhost:8080/ws?token=${jwt}`);

               ws.onopen = () => {
                    setSocket(ws);
                    setIsLive(true);
                    setIsConnecting(false);
                    setShowLivePanel(true);

                    // Send handshake
                    ws.send(JSON.stringify({
                         type: "handshake",
                         handshake: { userId, userName }
                    }));

                    // Join room
                    ws.send(JSON.stringify({
                         type: "join_room",
                         roomId: slug
                    }));

                    toast.success('You are now live! Share the link to collaborate.');
               };

               ws.onerror = () => {
                    setIsConnecting(false);
                    toast.error('Failed to connect. Is the server running?');
               };

               ws.onclose = () => {
                    setSocket(null);
                    setIsLive(false);
               };

          } catch (error) {
               setIsConnecting(false);
               toast.error('Failed to go live. Please try again.');
          }
     };

     // End live session
     const handleEndLive = () => {
          if (socket) {
               socket.close();
          }
          setSocket(null);
          setIsLive(false);
          setRoomSlug(null);
          setShowLivePanel(false);
          toast.success('Live session ended');
     };

     // Copy share link
     const handleCopyLink = () => {
          const link = `${window.location.origin}/room/${roomSlug}`;
          navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
          toast.success('Link copied to clipboard!');
     };

     // Cleanup on unmount
     useEffect(() => {
          return () => {
               if (socket) {
                    socket.close();
               }
          };
     }, [socket]);

     return (
          <>
               <CanvasEngine
                    roomId={roomSlug ?? undefined}
                    socket={socket ?? undefined}
                    userId={userId}
                    userName={userName}
               />

               {/* Go Live Button - Fixed position */}
               {!isLive && (
                    <button
                         onClick={handleGoLive}
                         disabled={isConnecting}
                         className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
            bg-gradient-to-r from-red-500 to-pink-600 text-white
            hover:shadow-lg hover:shadow-red-500/25 hover:scale-105
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                         {isConnecting ? (
                              <>
                                   <Loader2 className="w-4 h-4 animate-spin" />
                                   Connecting...
                              </>
                         ) : (
                              <>
                                   <Radio className="w-4 h-4" />
                                   Go Live
                              </>
                         )}
                    </button>
               )}

               {/* Live Panel - Shows when live */}
               {isLive && showLivePanel && (
                    <div className="fixed top-4 left-4 z-50 glass rounded-xl p-4 animate-slide-down min-w-[280px]">
                         {/* Header */}
                         <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                                   <span className="font-medium text-white">Live</span>
                              </div>
                              <button
                                   onClick={() => setShowLivePanel(false)}
                                   className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                              >
                                   <X size={16} />
                              </button>
                         </div>

                         {/* Share Link */}
                         <div className="mb-3">
                              <label className="text-xs text-gray-400 mb-1 block">Share this link</label>
                              <div className="flex gap-2">
                                   <input
                                        type="text"
                                        readOnly
                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/room/${roomSlug}`}
                                        className="flex-1 px-3 py-2 bg-black/30 rounded-lg text-sm text-gray-300 border border-white/10"
                                   />
                                   <button
                                        onClick={handleCopyLink}
                                        className={`px-3 rounded-lg transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white hover:bg-white/20'
                                             }`}
                                   >
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                   </button>
                              </div>
                         </div>

                         {/* Collaborators */}
                         <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                              <div className="flex items-center gap-2">
                                   <Users size={14} />
                                   <span>Waiting for collaborators...</span>
                              </div>
                         </div>

                         {/* End Session */}
                         <button
                              onClick={handleEndLive}
                              className="w-full py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
                         >
                              End Live Session
                         </button>
                    </div>
               )}

               {/* Minimized Live Indicator */}
               {isLive && !showLivePanel && (
                    <button
                         onClick={() => setShowLivePanel(true)}
                         className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl glass text-white hover:bg-white/10 transition-colors"
                    >
                         <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                         <span className="text-sm font-medium">Live</span>
                    </button>
               )}
          </>
     );
}