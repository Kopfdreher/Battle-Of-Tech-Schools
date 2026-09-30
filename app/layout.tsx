import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Geist, Outfit } from "next/font/google";
import { MietProviders } from "@/components/mietmatch/providers";
import { loadBoard } from "@/lib/board";
import "./globals.css";
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
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const board = await loadBoard();

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
