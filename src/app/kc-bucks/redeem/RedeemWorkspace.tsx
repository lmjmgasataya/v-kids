"use client";

import { useRouter } from "next/navigation";
import { KidLookupPanel } from "../KidLookupPanel";
import type { KcBucksKid } from "../actions";

export function RedeemWorkspace() {
  const router = useRouter();

  function goToKid(kid: KcBucksKid) {
    router.push(`/kc-bucks/redeem/${kid.id}`);
  }

  return <KidLookupPanel onSelect={goToKid} />;
}
