import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/client";

const wss = new WebSocketServer({ port: 6060 });

interface Users {
    userId: string;
    ws: WebSocket;
    rooms: string[];
}
const users: Users[] = [];

function checkUser(token: string): string | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === "string" || !decoded || !decoded.userId) {
            return null;
        }
        return decoded.userId;
    } catch (error) {
        console.error("Error verifying token:", error);
        return null;
    }
}

wss.on("connection", function connection(ws, request) {
    const url = request.url;
    if (!url) {
        console.error("No URL found in WebSocket connection request.");
        return;
    }

    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get("token") || "";
    console.log("Received WebSocket connection with token:", token);

    const userId = checkUser(token);
    if (userId == null) {
        console.error("Invalid or missing token. Closing connection.");
        ws.close();
        return;
    }

    console.log(`User authenticated: ${userId}`);

    users.push({
        userId,
        rooms: [],
        ws,
    });

    ws.on("message", async function message(data) {
        try {
            console.log("Received message from client:", data.toString());
            const parsedData = JSON.parse(data.toString());

            if (parsedData.type === "join_room") {
                console.log(`User ${userId} is joining room: ${parsedData.roomId}`);
                const user = users.find(x => x.ws === ws);
                if (user) {
                    user.rooms.push(parsedData.roomId);
                    console.log(`User ${userId} joined room ${parsedData.roomId}`);
                } else {
                    console.error("User not found while joining room.");
                }
            }

            if (parsedData.type === "leave_room") {
                console.log(`User ${userId} is leaving room: ${parsedData.roomId}`);
                const user = users.find(x => x.ws === ws);
                if (!user) {
                    console.error("User not found while leaving room.");
                    return;
                }
                user.rooms = user.rooms.filter(x => x !== parsedData.roomId);
                console.log(`User ${userId} left room ${parsedData.roomId}`);
            }

            if (parsedData.type === "chat") {
                console.log(`Chat message received from user ${userId} and room ${parsedData.roomId}`);
                

                const { roomId, message } = parsedData;
                if (!message || typeof message !== "string") {
                    console.error("Invalid message received:", parsedData);
                    return;
                }

                if (!roomId) {
                    console.error("roomId is missing or undefined. Full received data:", parsedData);
                    return;
                }

                console.log(`Saving message to database: roomId=${roomId}, message=${message}`);

                await prismaClient.chat.create({
                    data: {
                        roomId,
                        message,
                        userId,
                    },
                });

                console.log("Message saved. Broadcasting to users in room:", roomId);

                users.forEach(user => {
                    if (user.rooms.includes(roomId)) {
                        console.log(`Sending message to user ${user.userId} in room: ${roomId}`);
                        user.ws.send(
                            JSON.stringify({
                                type: "chat",
                                message: message,
                                roomId,
                            })
                        );
                    }
                });

                console.log("Message broadcast complete.");
            }
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    });

    ws.on("close", () => {
        console.log(`User ${userId} disconnected. Removing from active users.`);
        const index = users.findIndex(user => user.ws === ws);
        if (index !== -1) {
            users.splice(index, 1);
        }
    });
});
