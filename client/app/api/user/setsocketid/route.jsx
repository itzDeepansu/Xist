import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request){
    const body = await request.json();
    const user = await prisma.user.update({
        where:{
            phoneNumber:parseInt( body.phoneNumber)
        },
        data:{
            onlineStatus:true,
            socketID:body.socketID
        }
    })
    console.log("socket id updated");
    return NextResponse.json({status:"done"})
}