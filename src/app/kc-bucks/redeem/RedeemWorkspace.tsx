"use client";

import { useState, useTransition } from "react";
import { KidLookupPanel } from "../KidLookupPanel";
import { getKidBalanceForRedeem } from "./actions";
import { RedeemForm } from "./RedeemForm";
import type { KcBucksKid } from "../actions";

export function RedeemWorkspace() {
  const [kid, setKid] = useState<KcBucksKid | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setKid(null);
    setBalance(null);
    setError(null);
  }

  function handleSelect(nextKid: KcBucksKid) {
    setKid(nextKid);
    setBalance(null);
    setError(null);
    startTransition(async () => {
      const result = await getKidBalanceForRedeem(nextKid.id);
      if (typeof result === "object") {
        setError(result.error);
        return;
      }
      setBalance(result);
    });
  }

  if (!kid) {
    return <KidLookupPanel onSelect={handleSelect} />;
  }

  if (isPending || balance === null) {
    return (
      <div className="rounded-2xl border-2 border-kids-magenta/30 bg-kids-magenta/5 p-6">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-gray-400">Loading balance…</p>
        )}
      </div>
    );
  }

  return <RedeemForm kid={kid} initialBalance={balance} onDone={reset} />;
}
