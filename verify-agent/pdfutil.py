"""Minimal PDF writer/reader for demo payslips — no ReportLab required."""

from __future__ import annotations

import re


def _escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_payslip_pdf(*, producer: str, title: str, lines: list[str]) -> bytes:
    content_ops = ["BT", "/F1 11 Tf", "48 780 Td"]
    for index, line in enumerate(lines):
        if index:
            content_ops.append("0 -15 Td")
        content_ops.append(f"({_escape(line)}) Tj")
    content_ops.append("ET")
    stream = "\n".join(content_ops).encode("latin-1", "replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream",
        (
            f"<< /Title ({_escape(title)}) /Producer ({_escape(producer)}) "
            f"/Creator (MietMatcher Verify Agent) >>"
        ).encode("latin-1", "replace"),
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for i, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out.extend(f"{i} 0 obj\n".encode("ascii"))
        out.extend(body)
        out.extend(b"\nendobj\n")

    xref_pos = len(out)
    out.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    out.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        out.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    out.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R /Info 6 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(out)


def extract_producer(pdf: bytes) -> str:
    match = re.search(rb"/Producer \((.*?)\)", pdf, re.DOTALL)
    if not match:
        return ""
    return match.group(1).decode("latin-1", "replace").replace("\\(", "(").replace("\\)", ")")


def extract_text(pdf: bytes) -> str:
    chunks = re.findall(rb"\((.*?)\) Tj", pdf, re.DOTALL)
    lines: list[str] = []
    for chunk in chunks:
        text = chunk.decode("latin-1", "replace")
        text = text.replace("\\(", "(").replace("\\)", ")").replace("\\\\", "\\")
        lines.append(text)
    return "\n".join(lines)
