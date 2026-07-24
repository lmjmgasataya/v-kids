"use client";

import { useEffect, useRef, useState } from "react";
import { KidLookupPanel } from "../KidLookupPanel";
import { GrantForm } from "./GrantForm";
import type { KcBucksKid } from "../actions";

export function GrantWorkspace() {
  const [kid, setKid] = useState<KcBucksKid | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (kid) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [kid]);

  if (kid) {
    return (
      <div ref={resultRef} className="scroll-mt-4">
        <GrantForm kid={kid} onDone={() => setKid(null)} onGranted={() => setKid(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <KidLookupPanel onSelect={setKid} />
    </div>
  );
}
