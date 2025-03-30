
import { HTTP_BACKEND } from "@/config";
import axios from "axios";
type Shape =
   {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
    };

export async function InitDraw(canvas: HTMLCanvasElement, roomId: string , socket:WebSocket) {
  const ctx = canvas.getContext("2d");
  
  const existingShapes: Shape[] = await getExistingShapes(roomId);  //so before anything happens we accumulate the preexisting shapes from the database
  if (!ctx) return;
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if(message.type === "chat") {
        const parsedShape = JSON.parse(message.message)
        existingShapes.push(parsedShape.shape)
        clearCanvas(existingShapes , canvas , ctx);
        }
    }
 
  let clicked = false;
  let startX = 0;
  let startY = 0;

  // Initialize background
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const handleMouseDown = (e: MouseEvent) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
  };

  const handleMouseUp = (e: MouseEvent) => {   //broadcast function will be here as after mouse up we want to send it to the broadcast
    clicked = false;
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    const shape: Shape = {
      type: "rect",
      x: startX,
      y: startY,
      height,
      width,
    }
    if (!shape) {
      return;
  }
    existingShapes.push(shape);

    socket.send(JSON.stringify({
      type: "chat",
      message: JSON.stringify({
          shape
      }),
      roomId
  }))
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      clearCanvas(existingShapes, canvas, ctx);
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

function clearCanvas(
  existingShapes: Shape[],
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  existingShapes.map((shape) => {
    if (shape.type === "rect") {
      ctx.strokeStyle = "rgba(255,255,255)";
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  });
}

async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/chats/:${roomId}`);
  const messages = res.data.messages;
  const shapes = messages.map((x: { message: string }) => {
    //hum directly x ko string nhi de skte the kyuki x is message not string so first specified ki message is string
    const messageData = JSON.parse(x.message); //kyuki we will be sending type: "rect" , etc as a string to the databse and we want to get them as an object that's why we used JSON parse
    return messageData.shape;
  });
  return shapes;
}
