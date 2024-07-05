import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import bcrypt from "bcrypt";

export async function POST(request){
    const body = await request.json();
    const user = await prisma.user.findUnique({
        where:{
            phoneNumber: body.phoneNumber,
        }
    });
    if(!user || !bcrypt.compare(body.password, user.hashedPassword)){
        return NextResponse.json({error:"Invalid credentials"});
    }
    return NextResponse.json(user);
}