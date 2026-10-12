"use client";

import { useRouter } from "next/navigation";
import { KidLookupPanel } from "../KidLookupPanel";
import { CustomAmountButton } from "../CustomAmountButton";
import { GrantButton } from "./GrantButton";
import { grantCredits } from "./actions";
import type { KcBucksKid } from "../actions";
import { capitalizeName } from "@/lib/format";
import { KC_BUCKS_MAX_CUSTOM_GRANT } from "@/lib/constants";

export function GrantWorkspace() {
  const router = useRouter();

  function goToKid(kid: KcBucksKid) {
    router.push(`/kc-bucks/grant/${kid.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <KidLookupPanel
        onSelect={goToKid}
        renderAction={(kid, refresh) => (
          <div className="flex justify-end gap-2">
            <GrantButton
            kidId={kid.id}
            kidName={`${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}`}
            onSuccess={refresh}
          />
            <CustomAmountButton
              kid={kid}
              action={grantCredits.bind(null, kid.id)}
              title="Grant Custom Amount"
              confirmMessage={(amount, name) => `Grant ${amount} KC Bucks to ${name}?`}
              submitLabel="Grant"
              pendingLabel="Granting…"
              tone="green"
              max={KC_BUCKS_MAX_CUSTOM_GRANT}
              onSuccess={refresh}
            />
          </div>
        )}
      />
    </div>
  );
}
