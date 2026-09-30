import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../fixtures");
mkdirSync(fixturesDir, { recursive: true });

function escapePdf(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf({ producer, title, lines }) {
  const contentOps = ["BT", "/F1 12 Tf", "50 780 Td"];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) contentOps.push("0 -18 Td");
    contentOps.push(`(${escapePdf(lines[i])}) Tj`);
  }
  contentOps.push("ET");
  const stream = Buffer.from(contentOps.join("\n"), "latin1");

  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
    Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      Buffer.from("\nendstream"),
    ]),
    `<< /Title (${escapePdf(title)}) /Producer (${escapePdf(producer)}) /Creator (MietMatcher Payslip Engine) >>`,
  ];

  let out = Buffer.from("%PDF-1.4\n");
  const offsets = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(out.length);
    const objNum = i + 1;
    out = Buffer.concat([
      out,
      Buffer.from(`${objNum} 0 obj\n`),
      Buffer.isBuffer(objects[i]) ? objects[i] : Buffer.from(objects[i]),
      Buffer.from("\nendobj\n"),
    ]);
  }

  const xrefPos = out.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

  return Buffer.concat([out, Buffer.from(xref)]);
}

const mockFiles = [
  {
    name: "clean-datev.pdf",
    producer: "DATEV Lohn und Gehalt 14.2",
    title: "Gehaltsabrechnung Anna Berger",
    lines: [
      "GEHALTSABRECHNUNG / OFFICIAL PAYSLIP",
      "Employer: Nordbahn Tech Solutions GmbH",
      "Period: August 2026",
      "Employee: Anna Berger",
      "Gross: EUR 6400.00",
      "Tax/SV: EUR 1200.00",
      "Net: EUR 5200.00",
      "Standard payroll PDF generated via DATEV API.",
    ],
  },
  {
    name: "edited-ilovepdf.pdf",
    producer: "iLovePDF (PDF/A-1b suite)",
    title: "Gehaltsnachweis Jonas Klein",
    lines: [
      "GEHALTSABRECHNUNG / PAYSLIP",
      "Employer: Spree Media UG",
      "Period: August 2026",
      "Employee: Jonas Klein",
      "Gross: EUR 5100.00",
      "Tax/SV: EUR 1000.00",
      "Net: EUR 4100.00",
      "Processed through web PDF tool iLovePDF.",
    ],
  },
  {
    name: "math-fail.pdf",
    producer: "DATEV Lohn und Gehalt",
    title: "Gehaltsabrechnung Leyla Demir",
    lines: [
      "GEHALTSABRECHNUNG / PAYSLIP",
      "Employer: Kreuzberg Design Studio",
      "Period: August 2026",
      "Employee: Leyla Demir",
      "Gross: EUR 4200.00",
      "Tax/SV: EUR 900.00",
      "Net: EUR 3600.00", // Tampered: 4200 - 900 is 3300, not 3600!
      "Warning: Net pay altered to appear higher for landlord screening.",
    ],
  },
  {
    name: "name-mismatch.pdf",
    producer: "DATEV Lohn und Gehalt",
    title: "Gehaltsnachweis",
    lines: [
      "GEHALTSABRECHNUNG / PAYSLIP",
      "Employer: Ringbahn Logistics AG",
      "Period: August 2026",
      "Employee: Alex Schmidt", // Document is under Alex Schmidt, but applicant is Familie Okonkwo!
      "Gross: EUR 7600.00",
      "Tax/SV: EUR 1500.00",
      "Net: EUR 6100.00",
      "Identity mismatch test case.",
    ],
  },
  {
    name: "photoshop-canva.pdf",
    producer: "Adobe Photoshop 25.0 / Canva",
    title: "Payslip Export",
    lines: [
      "INCOME STATEMENT / PAYSLIP",
      "Employer: Graphic Export Studio",
      "Period: August 2026",
      "Employee: Nina Vogt",
      "Gross: EUR 3100.00",
      "Tax/SV: EUR 200.00",
      "Net: EUR 2400.00",
      "Created with raster design tool.",
    ],
  },
];

for (const item of mockFiles) {
  const buf = buildPdf(item);
  const path = resolve(fixturesDir, item.name);
  writeFileSync(path, buf);
  console.log(`Generated ${path} (${buf.length} bytes)`);
}
