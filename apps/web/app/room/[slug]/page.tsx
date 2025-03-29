import axios from "axios";
import { BACKEND_URL } from "../../config";
import { ChatRoom } from "../../components/ChatRoom";

async function getRoomId(slug: string) {
  const response = await axios.get(`${BACKEND_URL}/room/${slug}`);
  return response.data.room.id;         //response room return kr rha hai to we used room.id
}

export default async function ChatRoom1({
  params
}: {
  params: {
    slug: string;
  }
}) {
  const roomId = await getRoomId(params.slug);
  return <ChatRoom id={roomId} />
}
