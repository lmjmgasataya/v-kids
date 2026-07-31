"use client";

import { useRouter } from "next/navigation";
import { KidLookupPanel } from "../KidLookupPanel";
import type { KcBucksKid } from "../actions";

export function EditGrantsWorkspace() {
  const router = useRouter();

  function goToKid(kid: KcBucksKid) {
    router.push(`/kc-bucks/edit-grants/${kid.id}`);
  }

  return <KidLookupPanel onSelect={goToKid} />;
}
