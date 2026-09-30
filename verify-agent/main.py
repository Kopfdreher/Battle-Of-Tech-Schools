from __future__ import annotations

from typing import Any

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from engine import inspect_applicant, inspect_pdf_bytes
from generate_fixtures import main as write_fixtures

write_fixtures()

app = FastAPI(title="MietMatcher Payslip Verify Agent", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "payslip-verify-agent"}


@app.post("/inspect")
def inspect(payload: dict[str, Any]) -> dict[str, Any]:
    return inspect_applicant(payload)


@app.post("/inspect-many")
def inspect_many(payload: dict[str, Any]) -> dict[str, Any]:
    applicants = payload.get("applicants") or []
    reports = [inspect_applicant(item) for item in applicants]
    return {"reports": reports}


@app.post("/verify-document")
async def verify_document(
    displayName: str = Form(...),
    netIncomeMonthly: float = Form(0),
    hasIncomeProof: bool = Form(True),
    applicantId: str = Form(""),
    file: UploadFile | None = File(None),
) -> dict[str, Any]:
    applicant = {
        "id": applicantId,
        "displayName": displayName,
        "netIncomeMonthly": netIncomeMonthly,
        "hasIncomeProof": hasIncomeProof,
    }
    if file is not None:
        pdf = await file.read()
        return inspect_pdf_bytes(pdf, applicant)
    return inspect_applicant(applicant)
