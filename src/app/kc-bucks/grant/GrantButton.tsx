"use client";

import { useActionState } from "react";
import { grantCredits } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";

export function GrantButton({ kidId }: { kidId: number }) {
  const grantWithId = grantCredits.bind(null, kidId);
  const [state, action] = useActionState(grantWithId, undefined);
  useToastOnResult(state);

  return (
    <form action={action}>
      <SubmitButton
        label="+10"
        pendingLabel="…"
        className="text-xs font-bold text-white bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
      />
    </form>
  );
}
