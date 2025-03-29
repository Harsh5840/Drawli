'use client'
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket"

export function ChatRoomClient({
    messages,
    id
}: {
    messages : {message: string}[],    //important syntax
    id: string
}) {
    
    const {socket , loading} = useSocket();
    const [currentMessage , setCurrentMessage] = useState("");
    const [chats, setChats] = useState(messages);
    useEffect(() => {
        if(socket && !loading){

            socket.send(JSON.stringify({
                type: "join_room",
                roomId :  id
            }))

            socket.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                if(parsedData.type === "chat") {
                    setChats(c => [...c , {message: parsedData.message}])
                }
            }
            // return () => {
            //     socket?.close()
            // }
        }
    },[socket , loading , id]) 

    return (
       <div>
        {chats.map((m, index) => 
            <div key={index}>{m.message}</div>
        )}
        <input type="text" value={currentMessage} onChange={e => {
            setCurrentMessage(e.target.value);
        }
    } />
    <button onClick={() => {
        socket?.send(JSON.stringify({
            type: "chat",
            roomId: id,
            message: currentMessage
        }))
        setCurrentMessage("")
    }
    }></button>
    <button>Send Message</button>
       </div>
    )
}