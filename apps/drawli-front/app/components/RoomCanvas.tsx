"use client";

import { useEffect, useState } from "react";
import { WS_BACKEND } from "@/config";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  console.log("🟢 Received in RoomCanvas:", roomId);

  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!roomId) {
      console.error("🚨 Error: roomId is missing in RoomCanvas");
      return;
    }

    console.log("🔵 Creating WebSocket for room:", roomId);
    const ws = new WebSocket(`${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MzFlMGE0My1hZjkzLTQ4M2EtYjliNi04Njg1YzNjNmUzN2UiLCJpYXQiOjE3NDMxNjAwMDF9.wWCuse3ICIa1WnRWUHKnc5_-EIkh6n-3rMpzvIfiuQU`);

    ws.onopen = () => {
      console.log("✅ WebSocket Connected!");
      setSocket(ws);
      ws.send(JSON.stringify({ type: "join_room", roomId }));
      console.log("🔵 Sending join_room message to WebSocket for room:", roomId);
    };

    ws.onerror = (error) => {
      console.error("🔥 WebSocket Error:", error);
    };

    return () => {
      console.log("🛑 Closing WebSocket for room:", roomId);
      ws.close();
    };
  }, [roomId]);

  if (!socket) {
    console.log("⏳ Waiting for WebSocket connection...");
    return <div>Connecting Server ...</div>;
  }

  console.log("🟣 Passing roomId to Canvas:", roomId);
  return <Canvas roomId={roomId} socket={socket} />;
}
