"use client";

import { useActionState } from "react";
import { checkOutAllInService } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import { peopleCount } from "@/lib/format";
import type { CheckInPersonKind } from "@/lib/checkIn";

export function CheckOutAllButton({
  service,
  count,
  kind = "kid",
}: {
  service: string;
  count: number;
  kind?: CheckInPersonKind;
}) {
  const checkOutAllForService = checkOutAllInService.bind(null, service, kind);
  const [state, action] = useActionState(checkOutAllForService, undefined);
  useToastOnResult(state);

  if (count === 0) return null;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Check out all ${peopleCount(count, kind)} still checked in to ${service}?`)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton
        label={`Check out all (${count})`}
        pendingLabel="Checking out…"
        icon="👋"
        className="bg-kids-magenta hover:bg-kids-magenta/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-[transform,background-color,opacity] duration-150"
      />
    </form>
  );
}
