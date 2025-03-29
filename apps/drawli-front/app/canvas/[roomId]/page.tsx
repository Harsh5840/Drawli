"use client";
import { InitDraw} from "@/app/draw";
import { useEffect, useRef } from "react";

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    

    useEffect(() => {
        if (canvasRef.current) {
            InitDraw(canvasRef.current);
        }
    }, [canvasRef]);

    return (
        <div>
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} ></canvas>
        </div>
    );
}
