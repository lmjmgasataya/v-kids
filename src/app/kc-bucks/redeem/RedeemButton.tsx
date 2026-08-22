"use client";

import { useActionState } from "react";
import { redeemCredits } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";

export function RedeemButton({ kidId }: { kidId: number }) {
  const redeemWithId = redeemCredits.bind(null, kidId);
  const [state, action] = useActionState(redeemWithId, undefined);
  useToastOnResult(state);

  return (
    <form action={action}>
      <SubmitButton
        label="-10"
        pendingLabel="…"
        className="text-xs font-bold text-white bg-kids-magenta hover:bg-kids-magenta/90 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
      />
    </form>
  );
}
