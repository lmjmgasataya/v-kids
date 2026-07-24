"use client";

import { useState } from "react";
import { KidLookupPanel } from "../KidLookupPanel";
import { GrantForm } from "./GrantForm";
import type { KcBucksKid } from "../actions";

export function GrantWorkspace() {
  const [kid, setKid] = useState<KcBucksKid | null>(null);

  if (kid) {
    return <GrantForm kid={kid} onDone={() => setKid(null)} onGranted={() => setKid(null)} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <KidLookupPanel onSelect={setKid} />
    </div>
  );
}
