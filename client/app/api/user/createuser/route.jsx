import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import bcrypt from "bcrypt";
export async function POST(request) {
  const body = await request.json();
  const findUser = await prisma.user.findUnique({
    where: {
      phoneNumber: parseInt(body.phoneNumber),
    },
  });
  if (findUser) return NextResponse.json({ error: "User already exists" });
  const hashedPassword = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      phoneNumber: parseInt(body.phoneNumber),
      image: body.image,
      hashedPassword: hashedPassword,
      onlineStatus: false,
      socketID: null,
    },
  });

  return NextResponse.json({ message: "User created successfully" });
}
