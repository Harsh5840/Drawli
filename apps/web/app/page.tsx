'use client';
import { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

//TODO : REACT FORMS PLUS SHADCN


export default function Home() {
  const router = useRouter();
    const [roomId , SetRoomId] = useState("");
    
    return (
      <>
      <div>
        <input value={roomId} onChange={(e) => {
            SetRoomId(e.target.value)
        }} type="text" placeholder="Room id" />
        <button type="button" onClick={()=>{
            router.push(`/room/${roomId}`)
        }}>Join Room</button>
      </div>
      </>
    )
}