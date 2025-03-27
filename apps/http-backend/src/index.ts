import express from "express";
import z from "zod";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {CreateUserSchema, SigninSchema} from "@repo/common/types";
const app = express();

app.post("/signup", (req,res)=>{
    const data = CreateUserSchema.safeParse(req.body);
    if(!data.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    res.json({
        userId: "123"   //importantttttttttt    
    })
})

app.post("/signin", (req,res)=>{
    const data = SigninSchema.safeParse(req.body);
    if(!data.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    const userId = 1;
    const token = jwt.sign({  //we are encoding an object not a string
        userId
    },JWT_SECRET);
    res.json({
        token
    })
})

app.post("/room", middleware, (req,res)=>{
    res.json({
        roomId: 123
    })
})



app.listen(5000);