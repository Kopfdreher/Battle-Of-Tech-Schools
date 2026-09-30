"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  FileText,
  X,
  Upload,
  RefreshCw,
} from "lucide-react";
import type { AuthenticityReport, CheckStatus } from "@/lib/authenticity/types";
import { RedactedPayslip } from "./redacted-payslip";

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuthenticityReport;
  applicantIncome?: number | string;
}

export function InspectionModal({
  isOpen,
  onClose,
  report: initialReport,
  applicantIncome,
}: InspectionModalProps) {
  const [report, setReport] = useState<AuthenticityReport>(initialReport);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicantName", report.applicantName);
      if (applicantIncome) {
        formData.append("income", String(applicantIncome));
      }

      const res = await fetch("/api/verify-document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Verification failed");
      }

      const newReport: AuthenticityReport = await res.json();
      setReport(newReport);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to inspect file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDemoPreset = async (presetName: string) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      // Fetch the mock fixture directly
      const fileRes = await fetch(`/api/fixtures?file=${presetName}`);
      let fileBlob: Blob;
      if (fileRes.ok) {
        fileBlob = await fileRes.blob();
      } else {
        // Fallback: simulate request with JSON evaluation
        const res = await fetch("/api/verify-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicantName: presetName.includes("anna")
              ? "Anna Berger"
              : presetName.includes("jonas")
                ? "Jonas Klein"
                : presetName.includes("math")
                  ? "Leyla Demir"
                  : presetName.includes("name")
                    ? "Familie Okonkwo"
                    : "Nina Vogt",
            income: applicantIncome || 4000,
          }),
        });
        const rep = await res.json();
        setReport(rep);
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", fileBlob, presetName);
      formData.append("applicantName", report.applicantName);

      const res = await fetch("/api/verify-document", {
        method: "POST",
        body: formData,
      });
      const newReport = await res.json();
      setReport(newReport);
    } catch {
      // Ignore fallback error
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: CheckStatus) => {
    switch (status) {
      case "PASS":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            PASS
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            WARNING
          </span>
        );
      case "FAIL":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 border border-red-200">
            <XCircle className="h-3.5 w-3.5" />
            FAIL
          </span>
        );
    }
  };

  const checks = [
    report.metadataCheck,
    report.mathAudit,
    report.identityCheck,
    report.layoutCheck,
  ];

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900">
              <ShieldCheck className="h-5 w-5 text-zinc-800" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Document Authenticity & Fraud Audit
              </h2>
              <p className="text-xs text-zinc-500">
                {report.applicantName} · {report.documentLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Trust Index Banner */}
          <div
            className={`flex items-center justify-between rounded-lg border p-4 ${
              report.overallStatus === "verified"
                ? "border-emerald-200 bg-emerald-50/60"
                : report.overallStatus === "warning"
                  ? "border-amber-200 bg-amber-50/60"
                  : "border-red-200 bg-red-50/60"
            }`}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                Overall Trust Index
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-zinc-900">
                  {report.trustIndex}
                  <span className="text-base font-normal text-zinc-500">/100</span>
                </span>
                <span
                  className={`text-sm font-semibold capitalize ${
                    report.overallStatus === "verified"
                      ? "text-emerald-700"
                      : report.overallStatus === "warning"
                        ? "text-amber-700"
                        : "text-red-700"
                  }`}
                >
                  · {report.overallStatus === "verified" ? "High Trust" : report.overallStatus === "warning" ? "Needs Landlord Review" : "High Risk / Tampered"}
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-zinc-500">
              <span className="font-mono text-[11px] bg-white/80 rounded px-2 py-1 border border-zinc-200">
                Engine: {report.source}
              </span>
            </div>
          </div>

          {/* 4 Dimension Checks */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Automated Forensic Checks
            </h3>
            <div className="grid gap-2.5">
              {checks.map((check) => (
                <div
                  key={check.label}
                  className="flex items-start justify-between rounded-lg border border-zinc-200 bg-white p-3.5 transition-colors hover:border-zinc-300"
                >
                  <div className="pr-4">
                    <p className="text-sm font-medium text-zinc-900">
                      {check.label}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {check.detail}
                    </p>
                  </div>
                  <div>{getStatusBadge(check.status)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Flags Alert */}
          {report.flags.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50/80 p-4">
              <div className="flex items-center gap-2 text-red-900">
                <AlertOctagon className="h-4 w-4 shrink-0 text-red-600" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">
                  Tampering & Inconsistency Flags Detected ({report.flags.length})
                </h4>
              </div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-800">
                {report.flags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Redacted Document Preview (Anti-Bias AGG/GDPR) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Redacted Document Preview (Anti-Bias Inspection)
              </h3>
              <span className="text-[11px] text-zinc-500">
                GDPR & AGG Compliant
              </span>
            </div>
            <RedactedPayslip
              redacted={report.redacted}
              overallStatus={report.overallStatus}
            />
          </div>

          {/* Live Document Upload Testing */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-zinc-700" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                  Inspect Any Document (Live PDF Test)
                </h4>
              </div>
              {isUploading && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Analyzing PDF bytes...
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Upload a real candidate PDF to extract metadata, audit deductions math, and verify tamper-resistance in real-time.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition">
                <Upload className="h-3.5 w-3.5" />
                Upload PDF File
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>

              <button
                type="button"
                onClick={() => handleDemoPreset("clean-datev.pdf")}
                disabled={isUploading}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Sample: DATEV (Pass)
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset("edited-ilovepdf.pdf")}
                disabled={isUploading}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Sample: iLovePDF (Warn)
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset("math-fail.pdf")}
                disabled={isUploading}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Sample: Math Altered (Fail)
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset("name-mismatch.pdf")}
                disabled={isUploading}
                className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Sample: Name Mismatch (Fail)
              </button>
            </div>

            {uploadError && (
              <p className="mt-2 text-xs text-red-600">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 px-6 py-3 bg-zinc-50">
          <button
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
