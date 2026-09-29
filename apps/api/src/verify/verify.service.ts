import { Injectable, Logger } from '@nestjs/common';
import {
  inspectApplicantLocal,
  inspectManyLocal,
  type AuthenticityReport,
  type InspectInput,
} from './engine.js';

const AGENT_URL = process.env.VERIFY_AGENT_URL ?? 'http://127.0.0.1:8001';

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);

  async inspect(input: InspectInput): Promise<AuthenticityReport> {
    const fromAgent = await this.tryAgent('/inspect', input);
    if (fromAgent) return fromAgent as AuthenticityReport;
    return inspectApplicantLocal(input);
  }

  async inspectMany(applicants: InspectInput[]): Promise<AuthenticityReport[]> {
    const fromAgent = await this.tryAgent('/inspect-many', { applicants });
    if (fromAgent && Array.isArray((fromAgent as { reports?: unknown }).reports)) {
      return (fromAgent as { reports: AuthenticityReport[] }).reports;
    }
    return inspectManyLocal(applicants);
  }

  private async tryAgent(path: string, body: unknown): Promise<unknown | null> {
    try {
      const response = await fetch(`${AGENT_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(1200),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      this.logger.debug(`Verify agent unavailable (${AGENT_URL}): ${String(error)}`);
      return null;
    }
  }
}
