import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request){
    const body = await request.json()
    await prisma.user.update({
        where:{
            phoneNumber:parseInt( body.phoneNumber)
        },
        data:{
            onlineStatus:false
        }
    })
    return NextResponse.json({status:"done"})
}