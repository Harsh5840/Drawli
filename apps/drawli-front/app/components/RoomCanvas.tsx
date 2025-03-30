"use client";

import { useEffect, useState } from "react";
import { WS_BACKEND } from "@/config";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BACKEND}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3MWJjNjIxZi02MDk2LTQzNzItYWUzYi0zMmZjZjE5ZTY3YzIiLCJpYXQiOjE3NDMzMzk1NjR9.d9Pt8ow6YnQ1rrtoBD1HTF6uWcyAjj8HjkEMSRrA0vg`);
    
    ws.onopen = () => {
      console.log("WebSocket Connected!");
      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [roomId]);

  if (!socket) {
    return <div>Connecting Server ...</div>;
  }

  return <Canvas roomId={roomId} socket={socket} />;
}
