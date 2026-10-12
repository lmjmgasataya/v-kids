"use client";

import { useRouter } from "next/navigation";
import { KidLookupPanel } from "../KidLookupPanel";
import { CustomAmountButton } from "../CustomAmountButton";
import { RedeemButton } from "./RedeemButton";
import { redeemCredits } from "./actions";
import type { KcBucksKid } from "../actions";
import { capitalizeName } from "@/lib/format";

export function RedeemWorkspace() {
  const router = useRouter();

  function goToKid(kid: KcBucksKid) {
    router.push(`/kc-bucks/redeem/${kid.id}`);
  }

  return (
    <KidLookupPanel
      onSelect={goToKid}
      renderAction={(kid, refresh) => (
        <div className="flex justify-end gap-2">
          <RedeemButton
            kidId={kid.id}
            kidName={`${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}`}
            onSuccess={refresh}
          />
          <CustomAmountButton
            kid={kid}
            action={redeemCredits.bind(null, kid.id)}
            title="Redeem Custom Amount"
            confirmMessage={(amount, name) => `Redeem ${amount} KC Bucks from ${name}?`}
            submitLabel="Redeem"
            pendingLabel="Redeeming…"
            tone="magenta"
            onSuccess={refresh}
          />
        </div>
      )}
    />
  );
}
