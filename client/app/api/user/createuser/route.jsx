import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import bcrypt from "bcrypt";
export async function POST(request) {
  const body = await request.json();
  const findUser = await prisma.user.findMany({
    where: {
      phoneNumber: body.phoneNumber,
    },
  });
  if (findUser.length>=1) return NextResponse.json({ error: "User already exists" });
  const hashedPassword = await bcrypt.hash(body.password, 10);
  try{

    const user = await prisma.user.create({
      data: {
        name: body.name,
        phoneNumber: body.phoneNumber,
        image: body.image,
        hashedPassword: hashedPassword,
        onlineStatus: false,
        socketID: null,
      },
    });
  }catch(err){
    console.log(err,"errorrrrrrr");
  }

  return NextResponse.json({ status: 200});
}
