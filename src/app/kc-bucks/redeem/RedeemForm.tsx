"use client";

import { useActionState } from "react";
import { redeemCredits } from "./actions";
import { Field } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import type { KcBucksKid } from "../actions";

export function RedeemForm({
  kid,
  initialBalance,
  onDone,
}: {
  kid: KcBucksKid;
  initialBalance: number;
  onDone: () => void;
}) {
  const redeemWithId = redeemCredits.bind(null, kid.id);
  const [state, action] = useActionState(redeemWithId, undefined);
  const balance = state?.balance ?? initialBalance;
  useToastOnResult(state);

  return (
    <div className="rounded-2xl border-2 border-kids-magenta/30 bg-kids-magenta/5 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-kids-navy">
            {kid.firstName} {kid.lastName}
            {kid.nickname && <span className="text-xl text-black"> &quot;{kid.nickname}&quot;</span>}
          </div>
          <div className="text-xs text-gray-500">Age {kid.age}</div>
        </div>
        <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-kids-navy">
          Change kid
        </button>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">{balance}</span>
        <span className="text-sm text-gray-500">KC Bucks available</span>
      </div>

      <form action={action} className="flex flex-col gap-3">
        <Field label="Credits to redeem" name="amount" type="number" min={1} step={1} max={balance} required />
        <Field label="Redeemed for" name="reason" required placeholder="e.g. Toy car" />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm font-semibold text-kids-green">{state.success}</p>}
        <SubmitButton
          label="Redeem"
          pendingLabel="Redeeming…"
          className="bg-kids-magenta hover:bg-kids-magenta/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
        />
      </form>
    </div>
  );
}
