"use client";

import React, { useMemo, useState } from "react";
import type { AuthenticityReport, OverallStatus } from "@/lib/authenticity/types";
import { evaluateAuthenticity } from "@/lib/authenticity/engine";
import { combinedMatchPercent } from "@/lib/authenticity/score";
import { InspectionModal } from "./inspection-modal";

interface AuthenticityBadgeProps {
  applicant: {
    id?: string;
    applicantName: string;
    income: number | string;
    hasPermanentContract?: boolean;
  };
  /** When set with score/compact, blends match % with trust. */
  matchRate?: number;
  initialReport?: AuthenticityReport;
  /** `score` = list %, `compact` = detail %, `verify` = security badge in details. */
  variant?: "score" | "compact" | "verify";
  className?: string;
  caption?: string;
}

function statusTone(status: OverallStatus) {
  if (status === "verified") return "trust-ok";
  if (status === "warning") return "trust-warn";
  return "trust-bad";
}

function statusLabel(status: OverallStatus) {
  if (status === "verified") return "Verified";
  if (status === "warning") return "Warning";
  return "High risk";
}

export function AuthenticityBadge({
  applicant,
  matchRate,
  initialReport,
  variant = "score",
  className = "",
  caption,
}: AuthenticityBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const report = useMemo(
    () =>
      initialReport ??
      evaluateAuthenticity({
        id: applicant.id,
        applicantName: applicant.applicantName,
        income: applicant.income,
        hasPermanentContract: applicant.hasPermanentContract,
      }),
    [
      initialReport,
      applicant.id,
      applicant.applicantName,
      applicant.income,
      applicant.hasPermanentContract,
    ],
  );

  const isVerify = variant === "verify";
  const percent =
    !isVerify && typeof matchRate === "number"
      ? combinedMatchPercent(matchRate, report.trustIndex)
      : report.trustIndex;

  const tone = statusTone(report.overallStatus);
  const verifyLabel = statusLabel(report.overallStatus);
  const label =
    caption ??
    (isVerify
      ? verifyLabel
      : typeof matchRate === "number"
        ? percent >= 70
          ? "Match"
          : "Weak"
        : "Trust");

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        className={["trust-score", `trust-score-${variant}`, tone, className]
          .filter(Boolean)
          .join(" ")}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          setIsOpen(true);
        }}
        title={
          isVerify
            ? `Document trust ${report.trustIndex}/100 (${verifyLabel}) — inspect`
            : `Score ${percent}% · document trust ${report.trustIndex}/100 — inspect`
        }
        aria-label={
          isVerify
            ? `Document authenticity ${report.trustIndex} ${verifyLabel}. Open details.`
            : `Score ${percent} percent. Open authenticity details.`
        }
      >
        {isVerify ? (
          <>
            <strong>{report.trustIndex}</strong>
            <span>{label}</span>
          </>
        ) : (
          <>
            <strong>{percent}%</strong>
            <span>{label}</span>
          </>
        )}
      </span>

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
