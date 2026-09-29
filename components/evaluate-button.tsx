"use client";

import { useActionState } from "react";

import { rerunEvaluation, type EvaluateState } from "@/app/actions/evaluate";
import { Button } from "@/components/ui/button";

export function EvaluateButton({ applicationId }: { applicationId: string }) {
  const [state, action, pending] = useActionState<EvaluateState, FormData>(
    rerunEvaluation.bind(null, applicationId),
    null,
  );

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Re-run AI evaluation"}
      </Button>
      {state?.ok === false ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-zinc-600">
          Sent to n8n. Refresh after the workflow writes a score.
        </p>
      ) : null}
    </form>
  );
}
