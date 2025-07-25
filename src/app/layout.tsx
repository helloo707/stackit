import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/NextAuthProvider";
import BanCheck from "@/components/BanCheck";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import ChatbotWidget from "@/components/ChatbotWidget";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StackIt - Collaborative Q&A Platform",
  description: "A community-driven question and answer platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <BanCheck>
              {children}
            </BanCheck>
            <Toaster position="top-right" />
            <ChatbotWidget />
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
