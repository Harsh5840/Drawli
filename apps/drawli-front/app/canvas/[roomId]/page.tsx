import { RoomCanvas } from "@/app/components/RoomCanvas";


export default async function CanvasPage({params} :{  //whenever it says ki client function cant be async then trasnfer the client logic to some other tsx xompoment
    params: {
        roomId :string
    }
})  {
   
    const roomId = (await params).roomId;
    
    return <RoomCanvas roomId={roomId} />
}
