import NextAuth from "next-auth/next";
import prisma from "../../../libs/prismadb";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "number", placeholder: "1234567890" },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: {
            phoneNumber: parseInt(credentials.phoneNumber),
          },
        });
        if (!user || !user.hashedPassword) {
          throw new Error('Wrong account') ;
        }
        const isMatched = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
          );
          if (!isMatched) {
            throw new Error('Wrong password') ;
        }
        console.log(user);
        return user;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      console.log("JWT Token:", token);
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      console.log("Session:", session);
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };