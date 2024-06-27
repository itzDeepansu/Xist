import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request){
    const body = await request.json()
    const user = await prisma.user.findUnique({
        where:{
            phoneNumber: parseInt(body.phoneNumber)
        }
    })
    if(!user) return NextResponse.json({error:"user not found"})
    return NextResponse.json({user})
}