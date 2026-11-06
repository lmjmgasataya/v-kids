"use client";

import { useActionState } from "react";
import { checkOutKidForm, checkOutTeamMemberForm } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import { inputCls } from "@/components/form";
import type { CheckInPersonKind } from "@/lib/checkIn";

export function QuickCheckOutForm({
  kind = "kid",
  checkInId,
  service,
  onCheckedOut,
}: {
  kind?: CheckInPersonKind;
  checkInId: number;
  service: string;
  onCheckedOut: (checkInId: number, checkedOutAt: Date, remarks?: string) => void;
}) {
  const checkOut = kind === "team" ? checkOutTeamMemberForm : checkOutKidForm;
  const [state, action] = useActionState(async (prev: Awaited<ReturnType<typeof checkOut>> | undefined, formData: FormData) => {
    const result = await checkOut(checkInId, prev, formData);
    if (result.checkedOutAt) onCheckedOut(checkInId, result.checkedOutAt, result.remarks);
    return result;
  }, undefined);
  useToastOnResult(state);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="service" value={service} />
      <input name="remarks" placeholder="Remarks (optional)" maxLength={500} className={`${inputCls} w-40 py-1.5`} />
      <SubmitButton
        label="Check out"
        pendingLabel="…"
        icon="👋"
        className="bg-kids-magenta hover:bg-kids-magenta/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-[transform,background-color,opacity] duration-150"
      />
    </form>
  );
}
