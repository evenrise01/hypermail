import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "HyperMail",
  description: "HyperMail is the ultimate AI email assistant that automates organization, prioritizes important messages, and drafts smart replies. Boost productivity and declutter your inbox with cutting-edge AI. Try HyperMail today!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
