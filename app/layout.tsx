import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Geist, Outfit } from "next/font/google";
import { MietProviders } from "@/components/mietmatch/providers";
import { loadBoard } from "@/lib/board";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import "./globals.css";
import "../components/mietmatch/design-tokens.css";
import "../components/mietmatch/index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BesichtiGo · Landlord shortlist",
  description: "Berlin landlord shortlist, with listings and applications from the database",
  icons: {
    icon: "/brand/besichtigo-mark.png",
    apple: "/apple-icon.png",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  const board = await loadBoard(session?.user?.id);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${fraunces.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <MietProviders board={board}>{children}</MietProviders>
      </body>
    </html>
  );
}
