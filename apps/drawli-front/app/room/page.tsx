"use client"
import { createRoom } from '@/actions/room';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import React, { useRef } from 'react';
import toast from 'react-hot-toast';

function CreateJoinRoom() {
     const router = useRouter();
     const ref = useRef<HTMLInputElement | null>(null);
     const handleCreateRoom = async () => {
          const slug = ref.current?.value;
          if(!slug) {
               toast.error('Enter Room name')
               return;
          }
          console.log('crate room');
          const response =  await createRoom({
               name: slug
          })
          if(response) {
               router.push(`/room/${slug}`)
          }
     } 
     const handleJoinRoom = () => {
          const slug = ref.current?.value;
          if(!slug) {
               toast.error('Enter Room name')
               return;
          }
          console.log('join room');
          router.push(`/room/${slug}`)
     }
     return (
          <div className='flex justify-center items-center min-h-screen'>
               <div className='space-y-3'>
                    <Input type="text" ref={ref} placeholder="Room Name" />
                    <div className='flex flex-wrap justify-center items-center gap-2'>
                         <Button onClick={handleCreateRoom}>Create Room</Button>
                         <Button onClick={handleJoinRoom}>Join Room</Button>
                    </div>
               </div>
          </div>
     )
}

export default CreateJoinRoom