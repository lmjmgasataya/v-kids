"use client";

import { useActionState } from "react";
import { grantCredits, type GrantCreditsState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";

export function GrantButton({
  kidId,
  kidName,
  onSuccess,
}: {
  kidId: number;
  kidName: string;
  onSuccess?: () => void;
}) {
  const [state, action] = useActionState(async (prev: GrantCreditsState | undefined, formData: FormData) => {
    const result = await grantCredits(kidId, prev, formData);
    if (result.success) onSuccess?.();
    return result;
  }, undefined);
  useToastOnResult(state);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Grant 10 KC Bucks to ${kidName}?`)) e.preventDefault();
      }}
    >
      <SubmitButton
        label="+10 KC Bucks"
        pendingLabel="…"
        className="whitespace-nowrap text-xs font-bold text-white bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
      />
    </form>
  );
}
