"use server"

import { getPrisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function createListingAction(data: { address: string, rentAmount: number, rooms: number, title?: string, district?: string, bezirk?: string }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  const db = getPrisma()
  const listing = await db.listing.create({
    data: {
      address: data.address,
      rentAmount: data.rentAmount,
      rooms: data.rooms,
      title: data.title || data.address,
      userId: session.user.id
    }
  })
  return {
    ...listing,
    rentAmount: Number(listing.rentAmount),
    createdAt: listing.createdAt.toISOString()
  }
}
