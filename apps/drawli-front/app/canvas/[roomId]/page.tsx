"use client";
import { useEffect, useRef } from "react";

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const clickedRef = useRef(false);
    const startXRef = useRef(0);
    const startYRef = useRef(0);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const handleMouseDown = (e: MouseEvent) => {
            clickedRef.current = true;
            startXRef.current = e.clientX;
            startYRef.current = e.clientY;
        };

        const handleMouseUp = () => {
            clickedRef.current = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (clickedRef.current) {
                const width = e.clientX - startXRef.current;
                const height = e.clientY - startYRef.current;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.strokeRect(startXRef.current, startYRef.current, width, height);
            }
        };

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mousemove", handleMouseMove);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <div>
            <canvas ref={canvasRef} width={1000} height={1000} className="bg-yellow-200"></canvas>
        </div>
    );
}
