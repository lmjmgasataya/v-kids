"use client";

import { useActionState } from "react";
import { checkInKid } from "@/app/check-in/actions";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { Select } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";

export function CheckInNowForm({ kidId, defaultService }: { kidId: number; defaultService: string }) {
  const checkInWithId = checkInKid.bind(null, kidId);
  const [state, action] = useActionState(checkInWithId, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 w-full">
      <Select label="Service" name="serviceAttending" options={SERVICE_OPTIONS} defaultValue={defaultService} />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton
        label="Check in now"
        pendingLabel="Checking in…"
        className="bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
      />
    </form>
  );
}
