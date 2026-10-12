"use client";

import { useActionState, useState } from "react";
import { redeemCredits, type RedeemCreditsState } from "./actions";
import { CustomAmountButton } from "../CustomAmountButton";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import type { KcBucksKid } from "../actions";
import { capitalizeName } from "@/lib/format";

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
  const [balance, setBalance] = useState(initialBalance);
  // Both the quick redeem and the custom-amount popup report the new balance back here.
  function applyResult(result: RedeemCreditsState) {
    if (result.balance !== undefined) setBalance(result.balance);
  }
  const [state, action] = useActionState(async (prev: RedeemCreditsState | undefined, formData: FormData) => {
    const result = await redeemWithId(prev, formData);
    applyResult(result);
    return result;
  }, undefined);
  useToastOnResult(state);

  return (
    <div className="rounded-2xl border-2 border-kids-magenta/30 bg-kids-magenta/5 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-kids-navy">
            {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
            {kid.nickname && <span className="text-xl text-black"> &quot;{capitalizeName(kid.nickname)}&quot;</span>}
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

      <form
        action={action}
        onSubmit={(e) => {
          if (!confirm(`Redeem 10 KC Bucks from ${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}?`)) {
            e.preventDefault();
          }
        }}
        className="flex flex-col gap-3"
      >
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm font-semibold text-kids-green">{state.success}</p>}
        <SubmitButton
          label="Redeem 10 KC Bucks"
          pendingLabel="Redeeming…"
          className="bg-kids-magenta hover:bg-kids-magenta/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
        />
      </form>

      <CustomAmountButton
        kid={kid}
        action={redeemWithId}
        title="Redeem Custom Amount"
        confirmMessage={(amount, name) => `Redeem ${amount} KC Bucks from ${name}?`}
        submitLabel="Redeem"
        pendingLabel="Redeeming…"
        tone="magenta"
        label="Redeem custom amount"
        onSuccess={applyResult}
        className="border-2 border-kids-magenta text-kids-magenta hover:bg-kids-magenta/10 font-bold py-2.5 rounded-xl transition"
      />
    </div>
  );
}
