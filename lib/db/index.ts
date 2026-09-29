import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function getPrisma() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }

  return globalForPrisma.prisma;
}

export const applicationStatuses = [
  "pending",
  "shortlisted",
  "rejected",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export function riskFlagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((flag): flag is string => typeof flag === "string");
}
