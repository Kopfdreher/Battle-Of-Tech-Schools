import { inspectApplicantLocal } from './engine.js';

describe('payslip authenticity engine', () => {
  it('marks a DATEV slip as verified when name and math hold', () => {
    const report = inspectApplicantLocal({
      id: '1',
      displayName: 'Mara Ellison',
      netIncomeMonthly: 4200,
      hasIncomeProof: true,
    });
    expect(report.overallStatus).toBe('verified');
    expect(report.metadataCheck.status).toBe('PASS');
    expect(report.mathAudit.status).toBe('PASS');
    expect(report.identityCheck.status).toBe('PASS');
  });

  it('flags iLovePDF metadata as a warning', () => {
    const report = inspectApplicantLocal({
      id: '2',
      displayName: 'Jonas Richter',
      netIncomeMonthly: 3100,
      hasIncomeProof: true,
    });
    expect(report.overallStatus).toBe('warning');
    expect(report.metadataCheck.status).toBe('WARNING');
  });

  it('fails when net pay does not match gross minus deductions', () => {
    const report = inspectApplicantLocal({
      id: '3',
      displayName: 'Leila Hofmann',
      netIncomeMonthly: 2800,
      hasIncomeProof: true,
    });
    expect(report.mathAudit.status).toBe('FAIL');
    expect(report.overallStatus).toBe('fail');
  });

  it('fails when the payslip name is a different person', () => {
    const report = inspectApplicantLocal({
      id: '4',
      displayName: 'Samir Okonkwo',
      netIncomeMonthly: 5100,
      hasIncomeProof: true,
    });
    expect(report.identityCheck.status).toBe('FAIL');
    expect(report.identityCheck.documentName).toBe('Alex Schmidt');
  });
});
