import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { applicationStatuses, getPrisma, type ApplicationStatus } from "@/lib/db";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const applicationId = payload.applicationId;

  if (typeof applicationId !== "string" || !uuidPattern.test(applicationId)) {
    return NextResponse.json(
      { error: "applicationId must be a UUID" },
      { status: 400 },
    );
  }

  const patch: {
    score?: string;
    status?: ApplicationStatus;
    riskFlags?: string[];
  } = {};

  if ("score" in payload && payload.score !== undefined) {
    if (
      typeof payload.score !== "number" ||
      !Number.isFinite(payload.score) ||
      payload.score < 0 ||
      payload.score > 999.99
    ) {
      return NextResponse.json(
        { error: "score must be a number from 0 to 999.99" },
        { status: 400 },
      );
    }
    patch.score = payload.score.toFixed(2);
  }

  if ("status" in payload && payload.status !== undefined) {
    if (
      typeof payload.status !== "string" ||
      !applicationStatuses.includes(payload.status as ApplicationStatus)
    ) {
      return NextResponse.json(
        { error: "status must be pending, shortlisted, or rejected" },
        { status: 400 },
      );
    }
    patch.status = payload.status as ApplicationStatus;
  }

  if ("riskFlags" in payload && payload.riskFlags !== undefined) {
    if (
      !Array.isArray(payload.riskFlags) ||
      payload.riskFlags.some((flag) => typeof flag !== "string")
    ) {
      return NextResponse.json(
        { error: "riskFlags must be an array of strings" },
        { status: 400 },
      );
    }
    patch.riskFlags = payload.riskFlags;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Provide score, status, or riskFlags" },
      { status: 400 },
    );
  }

  try {
    const db = getPrisma();
    await db.application.update({
      where: { id: applicationId },
      data: patch,
    });

    return NextResponse.json({ ok: true, applicationId });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
