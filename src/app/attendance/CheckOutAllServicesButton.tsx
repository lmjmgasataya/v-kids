"use client";

import { useActionState } from "react";
import { checkOutAllInAllServicesForDate } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import { peopleCount } from "@/lib/format";
import type { CheckInPersonKind } from "@/lib/checkIn";

export function CheckOutAllServicesButton({
  date,
  count,
  kind = "kid",
}: {
  date: string;
  count: number;
  kind?: CheckInPersonKind;
}) {
  const checkOutAllForDate = checkOutAllInAllServicesForDate.bind(null, date, kind);
  const [state, action] = useActionState(checkOutAllForDate, undefined);
  useToastOnResult(state);

  if (count === 0) return null;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Check out all ${peopleCount(count, kind)} still checked in, across every service?`)) {
          e.preventDefault();
        }
      }}
    >
      <SubmitButton
        label={`Check out ALL services (${count})`}
        pendingLabel="Checking out…"
        icon="👋"
        className="bg-kids-magenta hover:bg-kids-magenta/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-[transform,background-color,opacity] duration-150"
      />
    </form>
  );
}
