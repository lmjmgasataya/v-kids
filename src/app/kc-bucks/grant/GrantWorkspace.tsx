"use client";

import { useRouter } from "next/navigation";
import { KidLookupPanel } from "../KidLookupPanel";
import type { KcBucksKid } from "../actions";

export function GrantWorkspace() {
  const router = useRouter();

  function goToKid(kid: KcBucksKid) {
    router.push(`/kc-bucks/grant/${kid.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <KidLookupPanel onSelect={goToKid} />
    </div>
  );
}
