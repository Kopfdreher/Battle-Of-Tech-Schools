"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { seedApplications, type SeedState } from "@/app/actions/seed";
import { Button } from "@/components/ui/button";

export function SeedButton() {
  const router = useRouter();
  const [state, action, pending] = useActionState<SeedState, FormData>(
    seedApplications,
    null,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate sample applications"}
      </Button>
      {state?.ok === false ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-zinc-600">
          Added {state.count} sample applications.
        </p>
      ) : null}
    </form>
  );
}
