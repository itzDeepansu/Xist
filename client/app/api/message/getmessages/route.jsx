import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request){
    const body = await request.json();
    const messages = await prisma.messages.findMany({
        where:{
            OR:[
                {
                    senderId:body.senderId,
                    recieverId:body.recieverId
                },
                {
                    senderId:body.recieverId,
                    recieverId:body.senderId
                }
            ]
        }
    })
    return NextResponse.json({messages})
}