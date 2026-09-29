"use server";

import { revalidatePath } from "next/cache";

export type EvaluateState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

export async function rerunEvaluation(
  applicationId: string,
  prev: EvaluateState,
): Promise<EvaluateState> {
  void prev;
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return { ok: false, error: "N8N_WEBHOOK_URL is not set" };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `n8n webhook returned ${response.status}`,
      };
    }

    revalidatePath(`/applications/${applicationId}`);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach n8n",
    };
  }
}
