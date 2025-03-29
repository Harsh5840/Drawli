import express from "express";
import z from "zod";
import cors from "cors";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types";
import bcrypt from "bcrypt";
import {prismaClient} from "@repo/db/client";
const app = express();
const saltRounds = 10;

app.use(express.json());
app.use(cors())

app.post("/signup", async (req, res) => {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    const hashPassword = await bcrypt.hash(parsedData.data.password , saltRounds);    //parsedData.password is incorrect and parsedData.data.password

    try {
        const user = await prismaClient.user.create({   //here we mentioned prismaClient.user.create and not used User
            data: {
                email: parsedData.data?.username,
                password: hashPassword,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists with this username"            //important status code for the message
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {    //the use of success keyword here
        res.json({ 
            message: "Incorrect inputs"
        })
        return;
    }

    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username
        }
    });

    if (!user) {
        res.status(403).json({
            message: "Not authorized"
        });
        return;
    }

    const validPassword = await bcrypt.compare(parsedData.data.password, user.password);
    if (!validPassword) {
        res.status(403).json({
            message: "Not authorized"
        });
        return;
    }

    const token = jwt.sign({
        userId: user?.id  //the wuestion check mark here
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room", middleware, async (req,res)=>{
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    
    try{
        //@ts-ignore
    const userId = req.userId;
    const room = await prismaClient.room.create({
        data:{
            slug: parsedData.data.name,
            adminId: userId
        }
    })
    res.json({
        roomId: room.id
    })
}catch(error) {
    res.json({
        message: "room already exists"
    })
}
})

app.get("/chats/:roomId", async (req, res) => {  //to get the old messages
    try{
    const roomId = Number(req.params.roomId);
    const messages = await prismaClient.chat.findMany({          //we used findMany and not findOne because we are fetching chats and not room
         where: {
            roomId: roomId
         },
         orderBy : {
            id:  "desc" 
         },
         take: 50
    })
    res.json({
        messages
    })
}catch(e) {
    res.json({
        messages: []
    })
}
})

app.get("/room/:slug", async (req, res) => {  //to get the old messages
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({          //we used findMany and not findOne because we are fetching chats and not room
         where: {
           slug
         },
    })
    res.json({
       room
    })
})



app.listen(5000 , ()=>{
    console.log("listening in http port");
});