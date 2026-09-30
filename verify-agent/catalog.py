from __future__ import annotations

from typing import Any

SCENARIOS: dict[str, dict[str, Any]] = {
    "mara ellison": {
        "key": "clean-datev",
        "document_label": "Payslip · DATEV Lohn",
        "producer": "DATEV Lohn und Gehalt",
        "employee_name": "Mara Ellison",
        "employer": "Nordbahn GmbH",
        "period": "August 2026",
        "gross": 5200.0,
        "tax_sv": 1000.0,
        "net": 4200.0,
        "layout": "PASS",
    },
    "jonas richter": {
        "key": "edited-ilovepdf",
        "document_label": "Payslip · uploaded PDF",
        "producer": "iLovePDF",
        "employee_name": "Jonas Richter",
        "employer": "Spree Werkstatt UG",
        "period": "August 2026",
        "gross": 3900.0,
        "tax_sv": 800.0,
        "net": 3100.0,
        "layout": "WARNING",
    },
    "leila hofmann": {
        "key": "math-fail",
        "document_label": "Payslip · edited net pay",
        "producer": "DATEV Lohn und Gehalt",
        "employee_name": "Leila Hofmann",
        "employer": "Kiez Logistics AG",
        "period": "August 2026",
        "gross": 3600.0,
        "tax_sv": 800.0,
        "net": 3400.0,
        "layout": "PASS",
    },
    "samir okonkwo": {
        "key": "name-mismatch",
        "document_label": "Payslip · identity mismatch",
        "producer": "DATEV Lohn und Gehalt",
        "employee_name": "Alex Schmidt",
        "employer": "Ringbahn Media GmbH",
        "period": "August 2026",
        "gross": 6400.0,
        "tax_sv": 1300.0,
        "net": 5100.0,
        "layout": "PASS",
    },
    "nina vogt": {
        "key": "photoshop-canva",
        "document_label": "Payslip · image export",
        "producer": "Adobe Photoshop 25.0 / Canva",
        "employee_name": "Nina Vogt",
        "employer": "Freelance invoice PDF",
        "period": "August 2026",
        "gross": 3100.0,
        "tax_sv": 200.0,
        "net": 2400.0,
        "layout": "FAIL",
    },
}


def normalize_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


def scenario_for(display_name: str, has_income_proof: bool, net_income: float) -> dict[str, Any]:
    if not has_income_proof:
        return {
            "key": "missing",
            "document_label": "No income proof uploaded",
            "producer": "",
            "employee_name": display_name,
            "employer": "—",
            "period": "—",
            "gross": 0.0,
            "tax_sv": 0.0,
            "net": float(net_income or 0),
            "layout": "FAIL",
            "missing": True,
        }
    preset = SCENARIOS.get(normalize_name(display_name))
    if preset:
        return {**preset, "missing": False}
    deductions = round(float(net_income) * 0.24, 2)
    gross = round(float(net_income) + deductions, 2)
    return {
        "key": "default-pass",
        "document_label": "Payslip · DATEV Lohn",
        "producer": "DATEV Lohn und Gehalt",
        "employee_name": display_name,
        "employer": "Berlin employer (demo)",
        "period": "August 2026",
        "gross": gross,
        "tax_sv": deductions,
        "net": float(net_income),
        "layout": "PASS",
        "missing": False,
    }
