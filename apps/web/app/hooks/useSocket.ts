import { useEffect, useState } from "react";
import { WS_URL } from "../config";

export function useSocket(){
    const [loading , setLoading] = useState(true);
    const [socket , setSocket] = useState<WebSocket>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MzFlMGE0My1hZjkzLTQ4M2EtYjliNi04Njg1YzNjNmUzN2UiLCJpYXQiOjE3NDMxNjAwMDF9.wWCuse3ICIa1WnRWUHKnc5_-EIkh6n-3rMpzvIfiuQU`);
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        } 
    },[]);


    return {
        socket, 
        loading
    };
}