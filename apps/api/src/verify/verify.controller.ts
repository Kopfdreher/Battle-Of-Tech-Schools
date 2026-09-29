import { Body, Controller, Get, Post } from '@nestjs/common';
import { VerifyService } from './verify.service.js';
import type { InspectInput } from './engine.js';

function asInput(raw: Record<string, unknown>): InspectInput {
  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    applicantId: typeof raw.applicantId === 'string' ? raw.applicantId : undefined,
    displayName: String(raw.displayName ?? ''),
    netIncomeMonthly: Number(raw.netIncomeMonthly ?? 0),
    hasIncomeProof: raw.hasIncomeProof === true,
  };
}

@Controller('api/verify')
export class VerifyController {
  constructor(private readonly verify: VerifyService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'mietmatcher-verify-gateway' };
  }

  @Post('inspect')
  inspect(@Body() body: Record<string, unknown>) {
    return this.verify.inspect(asInput(body));
  }

  @Post('inspect-many')
  inspectMany(@Body() body: { applicants?: Record<string, unknown>[] }) {
    const applicants = (body.applicants ?? []).map(asInput);
    return this.verify.inspectMany(applicants).then((reports) => ({ reports }));
  }
}
