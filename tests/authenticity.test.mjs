import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateAuthenticity, inspectPdfBytes } from "../lib/authenticity/engine.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../fixtures");

test("Anna Berger: Clean DATEV pass", () => {
  const report = evaluateAuthenticity({
    applicantName: "Anna Berger",
    income: 5200,
    hasPermanentContract: true,
  });

  assert.equal(report.overallStatus, "verified");
  assert.equal(report.trustIndex, 100);
  assert.equal(report.metadataCheck.status, "PASS");
  assert.equal(report.mathAudit.status, "PASS");
  assert.equal(report.identityCheck.status, "PASS");
  assert.equal(report.flags.length, 0);
});

test("Jonas Klein: iLovePDF warning", () => {
  const report = evaluateAuthenticity({
    applicantName: "Jonas Klein",
    income: 4100,
    hasPermanentContract: true,
  });

  assert.equal(report.overallStatus, "warning");
  assert.equal(report.metadataCheck.status, "WARNING");
  assert.match(report.metadataCheck.detail, /iLovePDF/);
  assert.equal(report.mathAudit.status, "PASS");
});

test("Leyla Demir: Math discrepancy fail", () => {
  const report = evaluateAuthenticity({
    applicantName: "Leyla Demir",
    income: 3600,
  });

  assert.equal(report.overallStatus, "fail");
  assert.equal(report.mathAudit.status, "FAIL");
  assert.match(report.mathAudit.detail, /Discrepancy/);
});

test("Familie Okonkwo: Name mismatch fail", () => {
  const report = evaluateAuthenticity({
    applicantName: "Familie Okonkwo",
    income: 6100,
  });

  assert.equal(report.overallStatus, "fail");
  assert.equal(report.identityCheck.status, "FAIL");
  assert.equal(report.identityCheck.documentName, "Alex Schmidt");
});

test("inspectPdfBytes: Real PDF byte inspection on clean-datev.pdf", () => {
  const bytes = new Uint8Array(readFileSync(resolve(fixturesDir, "clean-datev.pdf")));
  const report = inspectPdfBytes(bytes, "Anna Berger", 5200);

  assert.equal(report.overallStatus, "verified");
  assert.equal(report.trustIndex, 100);
  assert.match(report.producer, /DATEV/);
  assert.equal(report.mathAudit.status, "PASS");
});

test("inspectPdfBytes: Real PDF byte inspection on math-fail.pdf", () => {
  const bytes = new Uint8Array(readFileSync(resolve(fixturesDir, "math-fail.pdf")));
  const report = inspectPdfBytes(bytes, "Leyla Demir", 3600);

  assert.equal(report.overallStatus, "fail");
  assert.equal(report.mathAudit.status, "FAIL");
});
