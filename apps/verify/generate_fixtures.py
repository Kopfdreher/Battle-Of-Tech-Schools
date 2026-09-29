from pathlib import Path

from catalog import SCENARIOS
from pdfutil import build_payslip_pdf


def lines_for(item: dict) -> list[str]:
    return [
        "GEHALTSABRECHNUNG / PAYSLIP",
        f"Employer: {item['employer']}",
        f"Period: {item['period']}",
        f"Employee: {item['employee_name']}",
        f"Gross: EUR {item['gross']:.0f}",
        f"Tax/SV: EUR {item['tax_sv']:.0f}",
        f"Net: EUR {item['net']:.0f}",
        "This file is synthetic demo data for MietMatcher authenticity audit.",
    ]


def main() -> None:
    folder = Path(__file__).parent / "fixtures"
    folder.mkdir(exist_ok=True)
    for item in SCENARIOS.values():
        pdf = build_payslip_pdf(
            producer=item["producer"],
            title=f"Payslip {item['employee_name']}",
            lines=lines_for(item),
        )
        path = folder / f"{item['key']}.pdf"
        path.write_bytes(pdf)
        print(f"wrote {path} ({len(pdf)} bytes)")


if __name__ == "__main__":
    main()
