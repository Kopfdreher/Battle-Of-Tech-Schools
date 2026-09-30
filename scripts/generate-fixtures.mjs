import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(__dirname, "../fixtures");
mkdirSync(fixturesDir, { recursive: true });

function escapePdf(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/ä/g, "\\344")
    .replace(/ö/g, "\\366")
    .replace(/ü/g, "\\374")
    .replace(/Ä/g, "\\304")
    .replace(/Ö/g, "\\326")
    .replace(/Ü/g, "\\334")
    .replace(/ß/g, "\\337")
    .replace(/·/g, "\\267")
    .replace(/§/g, "\\247");
}

class PdfBuilder {
  constructor() {
    this.ops = [];
  }

  // Draw rectangle with optional fill and stroke
  rect(x, y, w, h, fill = null, stroke = null, lineWidth = 0.5) {
    this.ops.push("q");
    if (lineWidth) this.ops.push(`${lineWidth.toFixed(2)} w`);
    if (fill) this.ops.push(`${fill[0].toFixed(3)} ${fill[1].toFixed(3)} ${fill[2].toFixed(3)} rg`);
    if (stroke) this.ops.push(`${stroke[0].toFixed(3)} ${stroke[1].toFixed(3)} ${stroke[2].toFixed(3)} RG`);
    this.ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (fill && stroke) this.ops.push("B");
    else if (fill) this.ops.push("f");
    else if (stroke) this.ops.push("s");
    this.ops.push("Q");
  }

  // Draw horizontal or diagonal line
  line(x1, y1, x2, y2, color = [0.8, 0.8, 0.8], lineWidth = 0.5, dash = null) {
    this.ops.push("q");
    if (lineWidth) this.ops.push(`${lineWidth.toFixed(2)} w`);
    if (dash) this.ops.push(`[${dash.join(" ")}] 0 d`);
    this.ops.push(`${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG`);
    this.ops.push(`${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`);
  }

  // Draw text
  text(x, y, str, { font = "/F1", size = 9, color = [0.15, 0.15, 0.15] } = {}) {
    const escaped = escapePdf(str);
    this.ops.push(
      `q ${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg BT ${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET Q`
    );
  }

  // Text aligned to right
  textRight(rightX, y, str, { font = "/F1", size = 9, color = [0.15, 0.15, 0.15], approxCharWidth = 5.2 } = {}) {
    const width = str.length * (size / 10) * approxCharWidth;
    const x = rightX - width;
    this.text(x, y, str, { font, size, color });
  }

  buildStream() {
    return Buffer.from(this.ops.join("\n"), "latin1");
  }
}

function assemblePdf({ producer, title, stream }) {
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R /F2 7 0 R /F3 8 0 R >> >> >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
    Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      Buffer.from("\nendstream"),
    ]),
    `<< /Title (${escapePdf(title)}) /Producer (${escapePdf(producer)}) /Creator (DATEV Lohn und Gehalt) >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`,
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

/**
 * Generates an authentic-looking German DATEV Payslip (Entgeltabrechnung).
 */
function createAuthenticPayslip(config) {
  const p = new PdfBuilder();
  const left = 36;
  const right = 559;
  const width = right - left;

  const {
    producer,
    title,
    employerName,
    employerAddress,
    employerTaxNo = "30/284/10492",
    employerBetriebsNo = "B-82910421",
    employeeName,
    employeeId = "004128",
    employeeSvNo = "12 140591 B 042",
    employeeTaxId = "83 910 248 102",
    taxClass = "I / 1,000",
    healthInsurance = "Techniker Krankenkasse (TK)",
    entryDate = "01.03.2021",
    period = "August 2026",
    gross = 5000,
    deductions = 1200,
    net = 3800,
    isWebModified = false,
    isMathTampered = false,
    isPhotoshopExport = false,
  } = config;

  // 1. Top Brand Header
  // Logo block
  let textStartX = left + 72;
  if (isPhotoshopExport) {
    p.rect(left, 774, 92, 26, [0.85, 0.2, 0.4], null);
    p.text(left + 8, 782, "CANVA DESIGN", { font: "/F2", size: 9.5, color: [1, 1, 1] });
    textStartX = left + 102;
  } else {
    p.rect(left, 774, 62, 26, [0.0, 0.55, 0.27], null); // DATEV green
    p.text(left + 8, 782, "DATEV", { font: "/F2", size: 13, color: [1, 1, 1] });
  }

  p.text(textStartX, 790, isPhotoshopExport ? "Creative Payslip Document" : "Lohn und Gehalt pro", {
    font: "/F2",
    size: 11,
    color: [0.12, 0.16, 0.22],
  });
  p.text(textStartX, 778, "Entgeltabrechnung nach § 108 Abs. 3 Satz 1 GewO", {
    font: "/F1",
    size: 8,
    color: [0.45, 0.5, 0.58],
  });

  // Top right date & status
  p.text(right - 170, 790, `Abrechnungsmonat: ${period}`, {
    font: "/F2",
    size: 9.5,
    color: [0.12, 0.16, 0.22],
  });
  p.text(right - 170, 778, "Erstellt am 28.08.2026 · Originaldruck", {
    font: "/F1",
    size: 8,
    color: [0.45, 0.5, 0.58],
  });

  p.line(left, 764, right, 764, [0.8, 0.84, 0.88], 0.75);

  // 2. Info Cards: Arbeitgeber & Arbeitnehmer
  const cardY = 665;
  const cardH = 92;
  const colW = (width - 12) / 2;

  // Employer Card
  p.rect(left, cardY, colW, cardH, [0.98, 0.985, 0.99], [0.85, 0.88, 0.92], 0.5);
  p.rect(left, cardY + cardH - 16, colW, 16, [0.92, 0.94, 0.96], null);
  p.text(left + 8, cardY + cardH - 11.5, "1. ARBEITGEBER (FIRMA)", {
    font: "/F2",
    size: 7.5,
    color: [0.3, 0.35, 0.42],
  });

  p.text(left + 8, cardY + 60, employerName, { font: "/F2", size: 9.5, color: [0.1, 0.14, 0.2] });
  p.text(left + 8, cardY + 46, employerAddress, { font: "/F1", size: 8, color: [0.35, 0.4, 0.48] });
  p.text(left + 8, cardY + 32, `Betriebsnummer: ${employerBetriebsNo}`, {
    font: "/F1",
    size: 8,
    color: [0.35, 0.4, 0.48],
  });
  p.text(left + 8, cardY + 18, `Steuer-Nr: ${employerTaxNo} · Betriebsstätte Berlin`, {
    font: "/F1",
    size: 8,
    color: [0.35, 0.4, 0.48],
  });
  p.text(left + 8, cardY + 6, "Zuständige BG: VBG Hamburg / Berlin", {
    font: "/F3",
    size: 7,
    color: [0.5, 0.55, 0.62],
  });

  // Employee Card
  const empX = left + colW + 12;
  p.rect(empX, cardY, colW, cardH, [0.98, 0.985, 0.99], [0.85, 0.88, 0.92], 0.5);
  p.rect(empX, cardY + cardH - 16, colW, 16, [0.92, 0.94, 0.96], null);
  p.text(empX + 8, cardY + cardH - 11.5, "2. ARBEITNEHMER-STAMMDATEN", {
    font: "/F2",
    size: 7.5,
    color: [0.3, 0.35, 0.42],
  });

  p.text(empX + 8, cardY + 60, employeeName, { font: "/F2", size: 10.5, color: [0.1, 0.14, 0.2] });
  p.text(empX + 8, cardY + 46, `Personal-Nr: ${employeeId} · Eintritt: ${entryDate}`, {
    font: "/F1",
    size: 8,
    color: [0.35, 0.4, 0.48],
  });
  p.text(empX + 8, cardY + 32, `SV-Nr: ${employeeSvNo} · Steuer-ID: ${employeeTaxId}`, {
    font: "/F1",
    size: 8,
    color: [0.35, 0.4, 0.48],
  });
  p.text(empX + 8, cardY + 18, `Steuerklasse: ${taxClass} · Krankenkasse: ${healthInsurance}`, {
    font: "/F1",
    size: 8,
    color: [0.35, 0.4, 0.48],
  });
  // Key matcher string for byte inspector - keep clean name
  p.text(empX + 8, cardY + 6, `Employee: ${employeeName}`, {
    font: "/F1",
    size: 7.5,
    color: [0.45, 0.5, 0.58],
  });

  // 3. Brutto-Bezüge Table
  const table1Y = 560;
  p.rect(left, table1Y, width, 18, [0.22, 0.27, 0.34], null);
  p.text(left + 8, table1Y + 5.5, "Lohnart", { font: "/F2", size: 8, color: [1, 1, 1] });
  p.text(left + 65, table1Y + 5.5, "Bezeichnung der Bezüge", { font: "/F2", size: 8, color: [1, 1, 1] });
  p.text(left + 260, table1Y + 5.5, "Menge / Einheit", { font: "/F2", size: 8, color: [1, 1, 1] });
  p.text(left + 370, table1Y + 5.5, "Satz", { font: "/F2", size: 8, color: [1, 1, 1] });
  p.text(right - 80, table1Y + 5.5, "Betrag (EUR)", { font: "/F2", size: 8, color: [1, 1, 1] });

  // Rows
  const baseSalary = gross - 49;
  p.rect(left, table1Y - 20, width, 20, [0.99, 0.99, 1.0], [0.9, 0.92, 0.95], 0.5);
  p.text(left + 8, table1Y - 14, "1000", { font: "/F1", size: 8 });
  p.text(left + 65, table1Y - 14, "Gehalt / Monatsfestbezug", { font: "/F2", size: 8.5 });
  p.text(left + 260, table1Y - 14, "168,00 Std", { font: "/F1", size: 8 });
  p.text(left + 370, table1Y - 14, "Monat", { font: "/F1", size: 8 });
  p.text(right - 80, table1Y - 14, `${baseSalary.toFixed(2)}`, { font: "/F2", size: 8.5 });

  p.rect(left, table1Y - 40, width, 20, [0.96, 0.97, 0.98], [0.9, 0.92, 0.95], 0.5);
  p.text(left + 8, table1Y - 34, "2150", { font: "/F1", size: 8 });
  p.text(left + 65, table1Y - 34, "Fahrtkostenzuschuss (Deutschlandticket ÖPNV)", { font: "/F1", size: 8.5 });
  p.text(left + 260, table1Y - 34, "1,00 Monat", { font: "/F1", size: 8 });
  p.text(left + 370, table1Y - 34, "49,00", { font: "/F1", size: 8 });
  p.text(right - 80, table1Y - 34, "49.00", { font: "/F1", size: 8.5 });

  // Total Gross Line
  p.rect(left, table1Y - 60, width, 20, [0.92, 0.94, 0.97], [0.8, 0.84, 0.89], 0.75);
  p.text(left + 8, table1Y - 54, "Gesamtbrutto:", { font: "/F2", size: 9, color: [0.15, 0.2, 0.28] });
  // Key matcher string for byte inspector
  p.text(left + 80, table1Y - 54, `Gross: EUR ${gross.toFixed(2)}`, { font: "/F1", size: 8, color: [0.4, 0.45, 0.52] });
  p.text(right - 90, table1Y - 54, `EUR ${gross.toFixed(2)}`, { font: "/F2", size: 9.5, color: [0.12, 0.16, 0.24] });

  // 4. Gesetzliche Abzüge (Steuern & Sozialversicherung) Table
  const table2Y = 475;
  p.rect(left, table2Y, width, 18, [0.22, 0.27, 0.34], null);
  p.text(left + 8, table2Y + 5.5, "Gesetzliche Abzüge (Steuern / Sozialversicherungsbeiträge)", {
    font: "/F2",
    size: 8,
    color: [1, 1, 1],
  });
  p.text(left + 310, table2Y + 5.5, "Basis", { font: "/F2", size: 8, color: [1, 1, 1] });
  p.text(left + 390, table2Y + 5.5, "Beitragssatz", { font: "/F2", size: 8, color: [1, 1, 1] });
  p.text(right - 80, table2Y + 5.5, "Abzug (EUR)", { font: "/F2", size: 8, color: [1, 1, 1] });

  // Approximate realistic German deductions split
  const taxPart = Math.round(deductions * 0.52);
  const kvPart = Math.round(deductions * 0.21);
  const rvPart = Math.round(deductions * 0.19);
  const avPart = deductions - taxPart - kvPart - rvPart;

  const deductionsRows = [
    { name: "Lohnsteuer (Steuerklasse I)", basis: `EUR ${gross.toFixed(2)}`, rate: "EStG Tab.", val: taxPart },
    { name: "Solidaritätszuschlag", basis: "EUR 0,00", rate: "0,0 %", val: 0 },
    { name: "Krankenversicherung (KV AN-Anteil)", basis: `EUR ${gross.toFixed(2)}`, rate: "7,3% + 1,7%", val: kvPart },
    { name: "Rentenversicherung (RV AN-Anteil)", basis: `EUR ${gross.toFixed(2)}`, rate: "9,3 %", val: rvPart },
    { name: "Arbeitslosenversicherung (AV AN)", basis: `EUR ${gross.toFixed(2)}`, rate: "1,3 %", val: avPart },
  ];

  let currentY = table2Y - 18;
  deductionsRows.forEach((row, i) => {
    const bg = i % 2 === 0 ? [0.99, 0.99, 1.0] : [0.96, 0.97, 0.98];
    p.rect(left, currentY, width, 18, bg, [0.9, 0.92, 0.95], 0.5);
    p.text(left + 8, currentY + 5, row.name, { font: "/F1", size: 8 });
    p.text(left + 310, currentY + 5, row.basis, { font: "/F1", size: 8 });
    p.text(left + 390, currentY + 5, row.rate, { font: "/F1", size: 8 });
    p.text(right - 80, currentY + 5, `-${row.val.toFixed(2)}`, { font: "/F1", size: 8 });
    currentY -= 18;
  });

  // Total Deductions Line
  p.rect(left, currentY, width, 20, [0.92, 0.94, 0.97], [0.8, 0.84, 0.89], 0.75);
  p.text(left + 8, currentY + 5.5, "Gesamtabzüge (Steuer + SV):", { font: "/F2", size: 9, color: [0.15, 0.2, 0.28] });
  // Key matcher string for byte inspector
  p.text(left + 155, currentY + 5.5, `Tax/SV: EUR ${deductions.toFixed(2)}`, {
    font: "/F1",
    size: 8,
    color: [0.4, 0.45, 0.52],
  });
  p.text(right - 95, currentY + 5.5, `- EUR ${deductions.toFixed(2)}`, {
    font: "/F2",
    size: 9.5,
    color: [0.7, 0.15, 0.15],
  });

  // 5. Final Net Payout Box (Auszahlungsbetrag)
  const netBoxY = currentY - 82;
  const netBoxH = 72;

  // Background card styling
  if (isMathTampered) {
    // Math tampered: light yellow warning background in reality, but looks authentic
    p.rect(left, netBoxY, width, netBoxH, [0.99, 0.99, 0.96], [0.85, 0.75, 0.4], 1.2);
  } else {
    p.rect(left, netBoxY, width, netBoxH, [0.96, 0.985, 0.96], [0.2, 0.65, 0.3], 1.2);
  }

  // Left breakdown
  p.text(left + 14, netBoxY + 52, "Zusammenfassung:", { font: "/F2", size: 8.5, color: [0.3, 0.35, 0.4] });
  p.text(left + 14, netBoxY + 38, `Gesamt-Brutto: EUR ${gross.toFixed(2)}`, { font: "/F1", size: 8, color: [0.25, 0.3, 0.38] });
  p.text(left + 14, netBoxY + 24, `Gesetzliche Abzüge: - EUR ${deductions.toFixed(2)}`, {
    font: "/F1",
    size: 8,
    color: [0.65, 0.2, 0.2],
  });
  p.text(left + 14, netBoxY + 10, `Rechnerisches Netto: EUR ${(gross - deductions).toFixed(2)}`, {
    font: "/F1",
    size: 7.5,
    color: [0.45, 0.5, 0.58],
  });

  // Right big payout headline
  p.text(right - 230, netBoxY + 48, "AUSZAHLUNGSBETRAG (NETTOVERDIENST)", {
    font: "/F2",
    size: 8.5,
    color: [0.15, 0.4, 0.2],
  });
  p.text(right - 230, netBoxY + 22, `EUR ${net.toFixed(2)}`, {
    font: "/F2",
    size: 19,
    color: isMathTampered ? [0.8, 0.2, 0.1] : [0.08, 0.48, 0.22],
  });
  // Key matcher string for byte inspector
  p.text(right - 230, netBoxY + 8, `Net: EUR ${net.toFixed(2)} (Auszahlung)`, {
    font: "/F1",
    size: 7.5,
    color: [0.4, 0.45, 0.52],
  });

  // Bank transfer info
  const bankY = netBoxY - 26;
  p.rect(left, bankY, width, 22, [0.97, 0.98, 0.99], [0.88, 0.9, 0.93], 0.5);
  p.text(left + 8, bankY + 7, "Bankverbindung: Überweisung zum 31.08.2026 auf Girokonto DE44 1001 0010 •••• •••• 82", {
    font: "/F1",
    size: 8,
    color: [0.3, 0.35, 0.42],
  });
  p.text(right - 180, bankY + 7, "Berliner Sparkasse · BIC: BELADEBEXXX", {
    font: "/F2",
    size: 8,
    color: [0.3, 0.35, 0.42],
  });

  // 6. Security notice, perforations & legal footer
  const footerY = 160;
  p.line(left, footerY + 20, right, footerY + 20, [0.75, 0.8, 0.85], 0.5, [3, 2]);

  p.text(left, footerY + 8, "HINWEIS ZUR DOKUMENTENECHTHEIT & DATENSCHUTZ (§ 108 GEWO / AGG / DSGVO)", {
    font: "/F2",
    size: 7.5,
    color: [0.35, 0.4, 0.48],
  });

  if (isWebModified) {
    p.text(
      left,
      footerY - 3,
      "Dieser Nachweis wurde elektronisch verarbeitet. Modifiziert über Web-PDF-Suite (iLovePDF Cloud PDF/A Engine).",
      { font: "/F3", size: 7, color: [0.7, 0.3, 0.1] }
    );
  } else if (isMathTampered) {
    p.text(
      left,
      footerY - 3,
      "Offizieller Lohnnachweis. Achtung: Manuelle Abweichungen im Nettoauszahlungsbetrag vermerkt.",
      { font: "/F3", size: 7, color: [0.75, 0.2, 0.1] }
    );
  } else {
    p.text(
      left,
      footerY - 3,
      "Dieser Nachweis wurde maschinell erstellt und zertifiziert. Gültig ohne Unterschrift und Firmenstempel.",
      { font: "/F1", size: 7, color: [0.45, 0.5, 0.58] }
    );
  }

  p.text(
    left,
    footerY - 14,
    `DATEV Lohn und Gehalt v14.2 · Prüfziffer-Hash: SHA256:${Buffer.from(title + employeeName).toString("hex").slice(0, 32)} · Seite 1 von 1`,
    { font: "/F1", size: 6.8, color: [0.55, 0.6, 0.68] }
  );

  return assemblePdf({
    producer,
    title,
    stream: p.buildStream(),
  });
}

// Build all sample files
const mockFiles = [
  {
    fileName: "clean-datev.pdf",
    producer: "DATEV Lohn und Gehalt 14.2",
    title: "Gehaltsabrechnung Anna Berger",
    employerName: "Nordbahn Tech Solutions GmbH",
    employerAddress: "Brunnenstraße 128, 10115 Berlin",
    employeeName: "Anna Berger",
    employeeId: "004128",
    gross: 6400,
    deductions: 1200,
    net: 5200,
    isWebModified: false,
    isMathTampered: false,
  },
  {
    fileName: "edited-ilovepdf.pdf",
    producer: "iLovePDF (PDF/A-1b suite)",
    title: "Gehaltsnachweis Jonas Klein",
    employerName: "Spree Media UG (haftungsbeschränkt)",
    employerAddress: "Köpenicker Str. 154, 10997 Berlin",
    employeeName: "Jonas Klein",
    employeeId: "001849",
    gross: 5100,
    deductions: 1000,
    net: 4100,
    isWebModified: true,
    isMathTampered: false,
  },
  {
    fileName: "math-fail.pdf",
    producer: "DATEV Lohn und Gehalt",
    title: "Gehaltsabrechnung Leyla Demir",
    employerName: "Kreuzberg Design Studio GmbH",
    employerAddress: "Oranienstraße 42, 10999 Berlin",
    employeeName: "Leyla Demir",
    employeeId: "003290",
    gross: 4200,
    deductions: 900,
    net: 3600, // Tampered: 4200 - 900 = 3300, but doc claims 3600!
    isWebModified: false,
    isMathTampered: true,
  },
  {
    fileName: "name-mismatch.pdf",
    producer: "DATEV Lohn und Gehalt",
    title: "Gehaltsnachweis Alex Schmidt",
    employerName: "Ringbahn Logistics AG",
    employerAddress: "Tempelhofer Ufer 23, 10963 Berlin",
    employeeName: "Alex Schmidt", // Document is under Alex Schmidt, but applicant is Familie Okonkwo!
    employeeId: "009412",
    gross: 7600,
    deductions: 1500,
    net: 6100,
    isWebModified: false,
    isMathTampered: false,
  },
  {
    fileName: "photoshop-canva.pdf",
    producer: "Adobe Photoshop 25.0 / Canva",
    title: "Payslip Export Nina Vogt",
    employerName: "Creative Media & Design Berlin",
    employerAddress: "Kastanienallee 88, 10435 Berlin",
    employeeName: "Nina Vogt",
    employeeId: "000412",
    gross: 3100,
    deductions: 200,
    net: 2400,
    isWebModified: false,
    isMathTampered: true,
    isPhotoshopExport: true,
  },
];

for (const item of mockFiles) {
  const buf = createAuthenticPayslip(item);
  const path = resolve(fixturesDir, item.fileName);
  writeFileSync(path, buf);
  console.log(`Generated authentic payslip: ${path} (${buf.length} bytes)`);
}
