"use client";

import { useActionState, useEffect } from "react";
import { grantCredits } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import type { KcBucksKid } from "../actions";
import { capitalizeName } from "@/lib/format";

export function GrantForm({
  kid,
  onDone,
  onGranted,
}: {
  kid: KcBucksKid;
  onDone: () => void;
  onGranted: () => void;
}) {
  const grantWithId = grantCredits.bind(null, kid.id);
  const [state, action] = useActionState(grantWithId, undefined);

  useToastOnResult(state);

  useEffect(() => {
    if (state?.success) onGranted();
  }, [state, onGranted]);

  return (
    <div className="rounded-2xl border-2 border-kids-green/30 bg-kids-green/5 p-6 flex flex-col gap-4">
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

      <form action={action} className="flex flex-col gap-3">
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton
          label="Grant 10 KC Bucks"
          pendingLabel="Granting…"
          className="bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
        />
      </form>
    </div>
  );
}
