import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request) {
    const body = await request.json();
    console.log(body);
    const message = await prisma.messages.create({
            data: {
                messageContent: body.messageContent,
                senderId: body.senderId,
                recieverId: body.recieverId,
                seenStatus:false,
                isImage : body?.isImage,
                imageUrl : body?.imageUrl
            },
        });
    return NextResponse.json({message});
}