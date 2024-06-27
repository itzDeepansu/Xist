import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST (request){
    const body = await request.json();
    body.map(async (id)=>{
        await prisma.messages.update({
            where:{
                id:id
            },
            data:{
                seenStatus:true
            }
        })
    })
    console.log("status Changed");
    return NextResponse.json({status:200})
}