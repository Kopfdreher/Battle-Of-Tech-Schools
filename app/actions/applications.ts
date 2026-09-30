"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getPrisma } from "@/lib/db"
import { ApplicantDraft } from "@/components/mietmatch/lib/csv"

export async function importApplicationsAction(drafts: Omit<ApplicantDraft, 'id' | 'appliedAt'>[], mode: 'replace' | 'append') {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  const db = getPrisma()
  
  if (mode === 'replace') {
    // Delete existing applications for this user
    await db.application.deleteMany({
      where: { userId: session.user.id }
    });
  }

  const applications = drafts.map(draft => ({
    userId: session.user.id, // Ensure every application is linked to the logged in user
    displayName: draft.displayName,
    email: draft.email || null,
    netIncomeMonthly: draft.netIncomeMonthly,
    contractType: draft.contractType,
    employmentType: draft.employmentType,
    householdSize: draft.householdSize,
    hasArrearsLetter: draft.hasArrearsLetter,
    hasIncomeProof: draft.hasIncomeProof,
    hasEmploymentProof: draft.hasEmploymentProof,
    hasSchufa: draft.hasSchufa,
    smokes: draft.smokes,
    messagePreview: draft.messagePreview,
  }));

  const result = await db.application.createMany({
    data: applications,
  });

  return result.count;
}
