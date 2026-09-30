"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon, FileSearch } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AuthenticityReport, CheckStatus } from "@/lib/authenticity/types";
import { evaluateAuthenticity } from "@/lib/authenticity/engine";
import { InspectionModal } from "./inspection-modal";

interface AuthenticityCardProps {
  applicant: {
    id?: string;
    applicantName: string;
    income: number | string;
    hasPermanentContract?: boolean;
  };
}

export function AuthenticityCard({ applicant }: AuthenticityCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const report = evaluateAuthenticity({
    id: applicant.id,
    applicantName: applicant.applicantName,
    income: applicant.income,
    hasPermanentContract: applicant.hasPermanentContract,
  });

  const getStatusColor = (status: CheckStatus) => {
    switch (status) {
      case "PASS":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "WARNING":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "FAIL":
        return "text-red-700 bg-red-50 border-red-200";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payslip Authenticity & Anti-Fraud Audit</CardTitle>
              <CardDescription>
                Automated document forensic analysis and privacy-preserving redaction
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  report.overallStatus === "verified"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : report.overallStatus === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <span className="text-base font-bold">{report.trustIndex}/100</span>
                <span>
                  · {report.overallStatus === "verified" ? "Verified" : report.overallStatus === "warning" ? "Warning" : "High Risk"}
                </span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <div className="rounded-md border border-zinc-200 p-2.5">
              <span className="text-zinc-500">Metadata</span>
              <p className="mt-1 font-semibold text-zinc-900">
                {report.metadataCheck.status}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 truncate" title={report.metadataCheck.detail}>
                {report.metadataCheck.detail}
              </p>
            </div>

            <div className="rounded-md border border-zinc-200 p-2.5">
              <span className="text-zinc-500">Deduction Math</span>
              <p className="mt-1 font-semibold text-zinc-900">
                {report.mathAudit.status}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 truncate" title={report.mathAudit.detail}>
                {report.mathAudit.detail}
              </p>
            </div>

            <div className="rounded-md border border-zinc-200 p-2.5">
              <span className="text-zinc-500">Identity Match</span>
              <p className="mt-1 font-semibold text-zinc-900">
                {report.identityCheck.status}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 truncate" title={report.identityCheck.detail}>
                {report.identityCheck.detail}
              </p>
            </div>

            <div className="rounded-md border border-zinc-200 p-2.5">
              <span className="text-zinc-500">Layer Consistency</span>
              <p className="mt-1 font-semibold text-zinc-900">
                {report.layoutCheck.status}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500 truncate" title={report.layoutCheck.detail}>
                {report.layoutCheck.detail}
              </p>
            </div>
          </div>

          {report.flags.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <span className="font-semibold">⚠️ Flags detected: </span>
              {report.flags.join(" · ")}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-zinc-500">
              Personal identifying data is masked under AGG/GDPR. Financial metrics are certified.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="gap-1.5 cursor-pointer"
            >
              <FileSearch className="h-3.5 w-3.5" />
              Inspect Payslip & Redacted View
            </Button>
          </div>
        </CardContent>
      </Card>

      {isOpen && (
        <InspectionModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          report={report}
          applicantIncome={applicant.income}
        />
      )}
    </>
  );
}
