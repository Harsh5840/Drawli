"use client"

import { useEffect, useState } from "react";
import { WS_BACKEND } from "@/config";
import { Canvas } from "./Canvas";
 //jab canvas bna rhe tabhi websocket bhi setup krna hai wrna agar baad me setup kra to hoskta hai ki user draw kr rha pr vo socket tak nhi ja parhi
export function RoomCanvas({roomId} : {roomId: string}) {
   
    const [socket , setSocket] = useState<WebSocket | null>(null);

 
    useEffect(() => {
        const ws = new WebSocket(WS_BACKEND);
        setSocket(ws)

    },[])
    
    if(!socket) {
        return <div>
            Connecting Server ...
        </div>
    }
   return (
    <Canvas roomId={roomId} />
   )
}