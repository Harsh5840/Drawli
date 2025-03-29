"use client";

export function InitDraw(canvas: HTMLCanvasElement) {
    let clicked = false;
    let startX = 0;
    let startY = 0;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize background
    ctx.fillStyle = "rgba(0,0,0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const handleMouseDown = (e: MouseEvent) => {
        clicked = true;
  
        startX = e.clientX 
        startY = e.clientY 
    };

    const handleMouseUp = () => {
        clicked = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (clicked) {
            const width = e.clientX  - startX;
            const height = e.clientY - startY;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(0,0,0)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(255,255,255)";
            ctx.strokeRect(startX, startY, width, height);
        }
    };

    // Attach event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);

    // Return cleanup function
    return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("mousemove", handleMouseMove);
    };
}
