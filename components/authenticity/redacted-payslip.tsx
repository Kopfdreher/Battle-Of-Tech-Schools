import React from "react";
import type { RedactedPreview } from "@/lib/authenticity/types";
import { formatEuro } from "@/lib/metrics";

export function RedactedPayslip({
  redacted,
  overallStatus,
}: {
  redacted: RedactedPreview;
  overallStatus: "verified" | "warning" | "fail";
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-4 font-mono text-xs text-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
        <div>
          <span className="font-semibold text-zinc-900">{redacted.employer}</span>
          <span className="ml-2 text-zinc-500">· {redacted.period}</span>
        </div>
        <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-700">
          DATEV PAYROLL STUB
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase">Employee</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="inline-block rounded bg-zinc-900 px-2 py-0.5 tracking-wider text-zinc-900 select-none"
              title="Redacted to prevent discrimination (AGG / GDPR)"
            >
              ████ ██████
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-zinc-500 uppercase">Personal ID / Photo</p>
          <div className="mt-1">
            <span
              className="inline-block rounded bg-zinc-900 px-2 py-0.5 text-zinc-900 select-none"
              title="Redacted to prevent discrimination (AGG / GDPR)"
            >
              ████████████
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-zinc-500 uppercase">Gross Salary</p>
          <p className="mt-1 font-semibold text-zinc-900">
            {formatEuro(redacted.gross)}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-zinc-500 uppercase">Tax & SV Deductions</p>
          <p className="mt-1 font-semibold text-zinc-900">
            {formatEuro(redacted.deductions)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-md border border-zinc-200 bg-white p-3">
        <div>
          <span className="text-[11px] font-medium text-zinc-500 uppercase">
            Net Monthly Income (Verified)
          </span>
          <p className="font-sans text-xl font-bold tracking-tight text-emerald-700">
            {formatEuro(redacted.highlightedNet)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-zinc-500">Contract Verification</span>
          <p className="font-sans text-xs font-medium text-zinc-800">
            {redacted.contractHint}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-[10px] leading-relaxed text-zinc-500">
        🛡️ <span className="font-semibold">Privacy & Anti-Bias Notice:</span> Under German AGG and EU GDPR regulations, personal identifiers (name, ethnicity, age, photo) are masked for landlord review. Financial consistency and anti-tampering proofs are mathematically verified.
      </p>
    </div>
  );
}
