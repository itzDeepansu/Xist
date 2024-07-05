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
        phoneNumber: {
          label: "Phone Number",
          type: "number",
          placeholder: "1234567890",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        try {
          const user = await prisma.user.findMany({
            where: {
              phoneNumber: credentials.phoneNumber,
            },
          });
          if (user.length == 0 || user[0].hashedPassword == null) {
            throw new Error("Wrong account");
          }
          const isMatched = await bcrypt.compare(
            credentials.password,
            user[0].hashedPassword
          );
          if (!isMatched) {
            throw new Error("Wrong password");
          }
          return user[0];
        } catch (err) {
          console.log("not authorized");
        }
      },
    }),
  ],
  secret: "dasdasdasd",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
