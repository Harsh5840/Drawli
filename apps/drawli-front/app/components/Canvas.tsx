import { useEffect, useRef } from "react";
import { InitDraw } from "../draw";

export function Canvas({roomId} : {roomId : string}) {
     const canvasRef = useRef<HTMLCanvasElement>(null);
     useEffect(() => {
        if (canvasRef.current) {
            InitDraw(canvasRef.current , roomId , socket);
        }
    }, [canvasRef ,roomId]);
    return (
        <div>
            <canvas ref={canvasRef} width={10000} height={10000} ></canvas> 
        </div>
    );
}