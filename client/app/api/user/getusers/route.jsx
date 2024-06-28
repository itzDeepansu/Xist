import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";

export async function GET() {
  const users = await prisma.user.findMany({
    where: {
      onlineStatus: true,
    },
  });
  return NextResponse.json({ users });
}
