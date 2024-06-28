import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./libs/AuthProvider";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "XIST",
  description: "XIST Chat APP by Deepansu",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
     
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
