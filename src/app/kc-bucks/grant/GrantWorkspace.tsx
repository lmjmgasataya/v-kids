"use client";

import { useEffect, useState } from "react";
import { KidLookupPanel } from "../KidLookupPanel";
import { GrantForm } from "./GrantForm";
import type { KcBucksKid } from "../actions";

export function GrantWorkspace() {
  const [kid, setKid] = useState<KcBucksKid | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  function handleGranted(message: string) {
    setKid(null);
    setToast(message);
  }

  function handleSelect(nextKid: KcBucksKid) {
    setToast(null);
    setKid(nextKid);
  }

  if (kid) {
    return <GrantForm kid={kid} onDone={() => setKid(null)} onGranted={handleGranted} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className="rounded-xl bg-kids-green/10 border border-kids-green/30 text-kids-green text-sm font-semibold px-4 py-3 flex items-center justify-between gap-3">
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="text-kids-green/60 hover:text-kids-green"
          >
            ✕
          </button>
        </div>
      )}
      <KidLookupPanel onSelect={handleSelect} />
    </div>
  );
}
