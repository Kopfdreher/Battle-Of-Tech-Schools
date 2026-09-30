"use server";

import { revalidatePath } from "next/cache";

import { getPrisma } from "@/lib/db";
import { seedApplications as sampleApplications, seedListings } from "@/lib/seed-data";

export type SeedState =
  | { ok: true; count: number }
  | { ok: false; error: string }
  | null;

export async function seedApplications(prev: SeedState): Promise<SeedState> {
  void prev;
  try {
    const db = getPrisma();
    let listingRows = await db.listing.findMany({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (listingRows.length === 0) {
      listingRows = [];
      for (const listing of seedListings) {
        const created = await db.listing.create({
          data: listing,
          select: { id: true },
        });
        listingRows.push(created);
      }
    }

    await db.application.createMany({
      data: sampleApplications.map((application, index) => ({
        listingId: listingRows[application.listingIndex % listingRows.length].id,
        applicantName: application.applicantName,
        income: application.income,
        hasPermanentContract: application.hasPermanentContract,
        householdSize: application.householdSize,
        hasMietschuldenfrei: application.hasMietschuldenfrei,
        hasSchufa: application.hasSchufa,
        rawMessage: application.rawMessage,
        riskFlags: application.riskFlags,
      })),
    });

    revalidatePath("/");
    return { ok: true, count: sampleApplications.length };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not seed applications",
    };
  }
}
