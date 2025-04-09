import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request){
    const body = await request.json()
    await prisma.user.update({
        where:{
            phoneNumber: body.phoneNumber
        },
        data:{
            onlineStatus:true
        }
    })
    return NextResponse.json({status:"done"})
}