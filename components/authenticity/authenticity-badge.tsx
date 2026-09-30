"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";
import type { AuthenticityReport, OverallStatus } from "@/lib/authenticity/types";
import { evaluateAuthenticity } from "@/lib/authenticity/engine";
import { InspectionModal } from "./inspection-modal";

interface AuthenticityBadgeProps {
  applicant: {
    id?: string;
    applicantName: string;
    income: number | string;
    hasPermanentContract?: boolean;
  };
  initialReport?: AuthenticityReport;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function AuthenticityBadge({
  applicant,
  initialReport,
  size = "md",
  showIcon = true,
}: AuthenticityBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const report =
    initialReport ??
    evaluateAuthenticity({
      id: applicant.id,
      applicantName: applicant.applicantName,
      income: applicant.income,
      hasPermanentContract: applicant.hasPermanentContract,
    });

  const getStyle = (status: OverallStatus) => {
    switch (status) {
      case "verified":
        return {
          wrapper:
            "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 hover:border-emerald-300",
          dot: "bg-emerald-500",
          icon: ShieldCheck,
          label: "Verified",
        };
      case "warning":
        return {
          wrapper:
            "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/80 hover:border-amber-300",
          dot: "bg-amber-500",
          icon: AlertTriangle,
          label: "Warning",
        };
      case "fail":
        return {
          wrapper:
            "border-red-200 bg-red-50 text-red-900 hover:bg-red-100/80 hover:border-red-300",
          dot: "bg-red-500",
          icon: AlertOctagon,
          label: "High Risk",
        };
    }
  };

  const style = getStyle(report.overallStatus);
  const Icon = style.icon;

  const isSmall = size === "sm";

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }
        }}
        title={`Authenticity Score: ${report.trustIndex}/100 (${style.label}) - Click to inspect`}
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium transition-all select-none cursor-pointer ${
          isSmall ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        } ${style.wrapper}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot} animate-pulse`}
          aria-hidden="true"
        />
        <span className="font-semibold tabular-nums">{report.trustIndex}</span>
        <span className="text-zinc-600">·</span>
        <span>{style.label}</span>
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
