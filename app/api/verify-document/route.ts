import { NextRequest, NextResponse } from "next/server";
import { evaluateAuthenticity, inspectPdfBytes } from "@/lib/authenticity/engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const applicantName = (formData.get("applicantName") as string) || "Anonymous Applicant";
      const incomeStr = formData.get("income") as string | null;
      const income = incomeStr ? parseFloat(incomeStr) : 4000;

      if (!file) {
        return NextResponse.json(
          { error: "No PDF document uploaded" },
          { status: 400 },
        );
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const report = inspectPdfBytes(bytes, applicantName, income);
      return NextResponse.json(report);
    }

    const json = await req.json();
    const report = evaluateAuthenticity({
      id: json.id,
      applicantName: json.applicantName || "Applicant",
      income: json.income || 3000,
      hasPermanentContract: json.hasPermanentContract,
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to verify document",
      },
      { status: 500 },
    );
  }
}
