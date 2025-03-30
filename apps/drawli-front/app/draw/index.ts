import { HTTP_BACKEND } from "@/config";
import axios from "axios";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
    };

export async function InitDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return; // Ensure canvas context exists before proceeding.

  // Fetch pre-existing shapes and draw them before user interaction
  const existingShapes: Shape[] = await getExistingShapes(roomId);
  clearCanvas(existingShapes, canvas, ctx);

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "chat") {
      const parsedShape = JSON.parse(message.message);
      existingShapes.push(parsedShape.shape);
      clearCanvas(existingShapes, canvas, ctx);
    }
  };

  let clicked = false;
  let startX = 0;
  let startY = 0;

  const handleMouseDown = (e: MouseEvent) => {
    clicked = true;
    startX = e.clientX - canvas.offsetLeft;
    startY = e.clientY - canvas.offsetTop;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!clicked) return;
    clicked = false;

    const width = e.clientX - canvas.offsetLeft - startX;
    const height = e.clientY - canvas.offsetTop - startY;

    const shape: Shape = { type: "rect", x: startX, y: startY, width, height };
    existingShapes.push(shape);

    socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId,
      })
    );

    clearCanvas(existingShapes, canvas, ctx);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!clicked) return;

    const width = e.clientX - canvas.offsetLeft - startX;
    const height = e.clientY - canvas.offsetTop - startY;

    // Redraw existing shapes before drawing the temporary rectangle
    clearCanvas(existingShapes, canvas, ctx);
    ctx.strokeStyle = "rgba(255,255,255)";
    ctx.strokeRect(startX, startY, width, height);
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

function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  existingShapes.forEach((shape) => {
    if (shape.type === "rect") {
      ctx.strokeStyle = "rgba(255,255,255)";
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  });
}

async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/chats/${roomId}`);
  const messages = res.data.messages;
  return messages.map((x: { message: string }) => JSON.parse(x.message).shape);
}
