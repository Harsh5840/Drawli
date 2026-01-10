"use client";

import { useEffect, useState, useMemo } from "react";
import CanvasEngine from "./canvas/CanvasEngine";
import { Loader2 } from "lucide-react";

interface RoomCanvasProps {
     roomId: string;
}

export default function RoomCanvas({ roomId }: RoomCanvasProps) {
     const [socket, setSocket] = useState<WebSocket | null>(null);
     const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'error'>('connecting');

     // Generate a stable user ID and name
     const { userId, userName } = useMemo(() => {
          // Try to get from localStorage, or generate new ones
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

     useEffect(() => {
          if (!roomId) return;

          const token = localStorage.getItem('token') ?? "";
          const jwt = token.includes(' ') ? token.split(' ')[1] : token;

          // Connect to WebSocket
          const ws = new WebSocket(`ws://localhost:8080/ws?token=${jwt}`);

          ws.onopen = () => {
               setSocket(ws);
               setConnectionState('connected');

               // Send handshake with user info
               ws.send(JSON.stringify({
                    type: "handshake",
                    handshake: {
                         userId,
                         userName,
                    }
               }));

               // Join the room
               ws.send(JSON.stringify({
                    type: "join_room",
                    roomId,
               }));
          };

          ws.onerror = () => {
               setConnectionState('error');
          };

          ws.onclose = () => {
               setSocket(null);
          };

          return () => {
               ws.close();
          };
     }, [roomId, userId, userName]);

     // Loading state
     if (connectionState === 'connecting') {
          return (
               <div className="fixed inset-0 flex items-center justify-center bg-[hsl(220,20%,6%)]">
                    <div className="flex flex-col items-center gap-4 animate-fade-in">
                         <div className="relative">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-pulse-glow">
                                   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                        <path d="M12 19l7-7 3 3-7 7-3-3z" />
                                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                                        <path d="M2 2l7.586 7.586" />
                                        <circle cx="11" cy="11" r="2" />
                                   </svg>
                              </div>
                              <Loader2 className="absolute -bottom-1 -right-1 w-6 h-6 text-cyan-400 animate-spin" />
                         </div>
                         <div className="text-center">
                              <h2 className="text-lg font-medium text-white">Connecting to room...</h2>
                              <p className="text-sm text-gray-400 mt-1">Setting up real-time collaboration</p>
                         </div>
                    </div>
               </div>
          );
     }

     // Error state
     if (connectionState === 'error') {
          return (
               <div className="fixed inset-0 flex items-center justify-center bg-[hsl(220,20%,6%)]">
                    <div className="text-center animate-fade-in">
                         <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                                   <circle cx="12" cy="12" r="10" />
                                   <line x1="12" y1="8" x2="12" y2="12" />
                                   <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                         </div>
                         <h2 className="text-lg font-medium text-white mb-2">Connection Failed</h2>
                         <p className="text-sm text-gray-400 mb-4">Could not connect to the collaboration server</p>
                         <button
                              className="btn-primary"
                              onClick={() => window.location.reload()}
                         >
                              Try Again
                         </button>
                    </div>
               </div>
          );
     }

     return (
          <CanvasEngine
               roomId={roomId}
               socket={socket ?? undefined}
               userId={userId}
               userName={userName}
          />
     );
}