import axios from "axios";
import { BACKEND_URL } from "../../config";
import { ChatRoom } from "../../components/ChatRoom";

async function getRoomId(slug: string) {
  const response = await axios.get(`${BACKEND_URL}/room/${slug}`);
  return response.data.room.id;         //response room return kr rha hai to we used room.id
}

type PageParams = {
  params: {
    slug: string;
  };
};

export default async function Page({ params }: PageParams)  {
  const slug = (await params).slug
  const roomId = await getRoomId(slug);
  return <ChatRoom id={roomId} />
}
