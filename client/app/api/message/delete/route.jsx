import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function POST(request) {
  const body = await request.json();
  const message = await prisma.messages.delete({
    where: {
      id: body.id,
    },
  });
  return NextResponse.json({ status: 200 });
}
