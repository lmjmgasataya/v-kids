"use client";

import { useActionState, useEffect } from "react";
import { addGrant } from "./actions";
import { Field } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";

export function AddGrantForm({ kidId, onGranted }: { kidId: number; onGranted: () => void }) {
  const addGrantWithId = addGrant.bind(null, kidId);
  const [state, action] = useActionState(addGrantWithId, undefined);

  useToastOnResult(state);

  useEffect(() => {
    if (state?.success) onGranted();
  }, [state, onGranted]);

  return (
    <form
      action={action}
      key={state?.success ?? "idle"}
      className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex items-end gap-3">
        <div className="w-24">
          <Field label="Amount" name="amount" type="number" min={1} step={1} required />
        </div>
        <SubmitButton
          label="Add credits"
          pendingLabel="Adding…"
          className="bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl transition"
        />
      </div>
    </form>
  );
}
