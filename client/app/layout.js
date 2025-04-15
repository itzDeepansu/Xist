import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "./libs/AuthProvider";
import { Bebas_Neue, JetBrains_Mono, Dancing_Script } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: "XIST",
  description: "XIST Chat APP by Deepansu",
  icons: {
    icon: "/favicon.ico",
  },
};
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "300",
  variable: "--font-jetbrainsmono",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={` ${jetbrainsMono.variable}`}>
        {/* <body className={inter.className}> */}
        <AuthProvider>
          {children}
          <Toaster position="top-right" reverseOrder={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
