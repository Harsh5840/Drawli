import { WebSocketServer } from "ws";

const wss= new WebSocketServer({port : 6000});

wss.on("connection" , function connnection(ws){
    ws.on('message', function message(data) {
            ws.send("pong");
    })
    })
