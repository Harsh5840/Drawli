import { useEffect, useRef } from "react";
import { InitDraw } from "../draw";

export function Canvas({roomId , socket}:{roomId: string , socket:WebSocket}) {

     const canvasRef = useRef<HTMLCanvasElement>(null);
     useEffect(() => {
        if (canvasRef.current) {
            InitDraw(canvasRef.current , roomId , socket);
        }
    }, [roomId, socket]);
    console.log("Received roomId in Canvas:", roomId);
    return (
        <div>
            <canvas ref={canvasRef} width={10000} height={10000} ></canvas> 
        </div>
    );
}