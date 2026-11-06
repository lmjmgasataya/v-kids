"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { checkInKid, type CheckInActionState } from "@/app/check-in/actions";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { withToast } from "@/lib/toast";
import { Select } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";

export function CheckInNowForm({ kidId, defaultService }: { kidId: number; defaultService: string }) {
  const router = useRouter();
  // checkInKid returns instead of redirecting (it's built for the check-in page), so go to
  // that service's check-in page from here.
  const [state, action] = useActionState(async (prev: CheckInActionState | undefined, formData: FormData) => {
    const result = await checkInKid(kidId, prev, formData);
    if (result.checkIn) {
      const service = encodeURIComponent(result.checkIn.serviceAttending);
      router.push(withToast(`/check-in/kids?service=${service}&intent=checkin&mode=search`, "success", result.success!));
    }
    return result;
  }, undefined);

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
