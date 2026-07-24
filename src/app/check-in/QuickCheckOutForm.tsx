"use client";

import { useActionState } from "react";
import { checkOutKidForm } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import { inputCls } from "@/components/form";

export function QuickCheckOutForm({ checkInId, service }: { checkInId: number; service: string }) {
  const checkOutWithId = checkOutKidForm.bind(null, checkInId);
  const [state, action] = useActionState(checkOutWithId, undefined);
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
