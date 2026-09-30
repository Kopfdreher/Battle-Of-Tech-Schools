from __future__ import annotations

from typing import Any

from catalog import scenario_for
from pdfutil import extract_producer, extract_text

SUSPICIOUS_PRODUCERS = ("photoshop", "canva", "ilovepdf", "preview", "acrobat distiller")


def _overall(trust: int, checks: list[str]) -> str:
    if "FAIL" in checks or trust < 70:
        return "fail"
    if "WARNING" in checks or trust < 90:
        return "warning"
    return "verified"


def inspect_from_fields(
    *,
    applicant_id: str,
    display_name: str,
    net_income_monthly: float,
    has_income_proof: bool,
    producer: str | None = None,
    document_name: str | None = None,
    gross: float | None = None,
    tax_sv: float | None = None,
    net: float | None = None,
    layout: str | None = None,
    source: str = "python-agent",
) -> dict[str, Any]:
    scenario = scenario_for(display_name, has_income_proof, net_income_monthly)
    flags: list[str] = []

    if scenario.get("missing"):
        return {
            "applicantId": applicant_id,
            "documentLabel": scenario["document_label"],
            "overallStatus": "fail",
            "trustIndex": 18,
            "producer": "",
            "source": source,
            "metadataCheck": {
                "status": "FAIL",
                "label": "Metadata",
                "detail": "No payroll PDF was attached for this applicant.",
            },
            "mathAudit": {
                "status": "FAIL",
                "label": "Math audit",
                "detail": "Cannot verify Gross − deductions = Net without a payslip.",
                "gross": 0,
                "deductions": 0,
                "net": net_income_monthly,
                "expectedNet": None,
            },
            "identityCheck": {
                "status": "FAIL",
                "label": "Identity",
                "detail": "No document name to compare with the applicant.",
                "applicantName": display_name,
                "documentName": None,
            },
            "layoutCheck": {
                "status": "FAIL",
                "label": "Alteration",
                "detail": "Missing file — treated as unverified.",
            },
            "flags": ["Income proof missing."],
            "redacted": {
                "employer": "—",
                "period": "—",
                "highlightedNet": net_income_monthly,
                "contractHint": "Unknown",
            },
        }

    used_producer = producer if producer is not None else str(scenario["producer"])
    used_name = document_name if document_name is not None else str(scenario["employee_name"])
    used_gross = float(scenario["gross"] if gross is None else gross)
    used_tax = float(scenario["tax_sv"] if tax_sv is None else tax_sv)
    used_net = float(scenario["net"] if net is None else net)
    used_layout = layout or str(scenario["layout"])

    metadata_status = "PASS"
    metadata_detail = f"Standard payroll producer: {used_producer or 'unknown'}."
    producer_l = used_producer.lower()
    if any(tool in producer_l for tool in SUSPICIOUS_PRODUCERS):
        metadata_status = "WARNING"
        metadata_detail = f"Document processed by non-payroll software ({used_producer})."
        flags.append("Metadata: editing/export tool detected.")

    expected_net = round(used_gross - used_tax, 2)
    math_status = "PASS"
    math_detail = f"Gross €{used_gross:.0f} − deductions €{used_tax:.0f} = net €{used_net:.0f}."
    if abs(expected_net - used_net) > 1.0:
        math_status = "FAIL"
        math_detail = (
            f"Net salary discrepancy: expected €{expected_net:.0f} "
            f"(gross − tax/SV), document shows €{used_net:.0f}."
        )
        flags.append(math_detail)

    identity_status = "PASS"
    identity_detail = "Payslip name matches the applicant (after redaction in the landlord view)."
    if normalize_simple(used_name) != normalize_simple(display_name):
        identity_status = "FAIL"
        identity_detail = (
            f"Name on document ({used_name}) does not match applicant ({display_name})."
        )
        flags.append("Identity mismatch between applicant and payslip.")

    layout_status = used_layout if used_layout in {"PASS", "WARNING", "FAIL"} else "PASS"
    layout_detail = {
        "PASS": "Single-layer Type1 text — no font/overlay mismatch detected.",
        "WARNING": "Extra content stream / export artifact — possible visual edit.",
        "FAIL": "Layer/font mismatch typical of image-in-PDF or design-tool export.",
    }[layout_status]
    if layout_status != "PASS":
        flags.append("Layout consistency warning.")

    trust = 100
    if metadata_status == "WARNING":
        trust -= 15
    if metadata_status == "FAIL":
        trust -= 35
    if math_status == "FAIL":
        trust -= 40
    if identity_status == "FAIL":
        trust -= 35
    if layout_status == "WARNING":
        trust -= 12
    if layout_status == "FAIL":
        trust -= 20
    trust = max(0, min(100, trust))

    checks = [metadata_status, math_status, identity_status, layout_status]
    overall = _overall(trust, checks)

    return {
        "applicantId": applicant_id,
        "documentLabel": scenario["document_label"],
        "overallStatus": overall,
        "trustIndex": trust,
        "producer": used_producer,
        "source": source,
        "metadataCheck": {
            "status": metadata_status,
            "label": "Metadata",
            "detail": metadata_detail,
        },
        "mathAudit": {
            "status": math_status,
            "label": "Math audit",
            "detail": math_detail,
            "gross": used_gross,
            "deductions": used_tax,
            "net": used_net,
            "expectedNet": expected_net,
        },
        "identityCheck": {
            "status": identity_status,
            "label": "Identity",
            "detail": identity_detail,
            "applicantName": display_name,
            "documentName": used_name,
        },
        "layoutCheck": {
            "status": layout_status,
            "label": "Alteration",
            "detail": layout_detail,
        },
        "flags": flags,
        "redacted": {
            "employer": scenario["employer"],
            "period": scenario["period"],
            "highlightedNet": used_net,
            "contractHint": "Permanent / employed (from structured fields, not the photo)",
        },
    }


def normalize_simple(name: str) -> str:
    return " ".join(name.strip().lower().replace("á", "a").replace("ó", "o").split())


def inspect_pdf_bytes(pdf: bytes, applicant: dict[str, Any]) -> dict[str, Any]:
    text = extract_text(pdf)
    producer = extract_producer(pdf)
    name_match = None
    for line in text.splitlines():
        if line.lower().startswith("employee:") or line.lower().startswith("name:"):
            name_match = line.split(":", 1)[1].strip()
    gross = _money(text, r"Gross(?: pay)?:\s*EUR?\s*([0-9.]+)")
    tax = _money(text, r"(?:Tax/SV|Deductions):\s*EUR?\s*([0-9.]+)")
    net = _money(text, r"Net(?: pay)?:\s*EUR?\s*([0-9.]+)")
    layout = "WARNING" if any(t in producer.lower() for t in ("photoshop", "canva", "ilovepdf")) else "PASS"
    return inspect_from_fields(
        applicant_id=str(applicant.get("id") or applicant.get("applicantId") or ""),
        display_name=str(applicant.get("displayName") or ""),
        net_income_monthly=float(applicant.get("netIncomeMonthly") or 0),
        has_income_proof=bool(applicant.get("hasIncomeProof", True)),
        producer=producer,
        document_name=name_match,
        gross=gross,
        tax_sv=tax,
        net=net,
        layout=layout,
        source="python-pdf",
    )


def _money(text: str, pattern: str) -> float | None:
    import re

    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None
    return float(match.group(1))


def inspect_applicant(payload: dict[str, Any]) -> dict[str, Any]:
    return inspect_from_fields(
        applicant_id=str(payload.get("id") or payload.get("applicantId") or ""),
        display_name=str(payload.get("displayName") or ""),
        net_income_monthly=float(payload.get("netIncomeMonthly") or 0),
        has_income_proof=bool(payload.get("hasIncomeProof", True)),
        source="python-agent",
    )
