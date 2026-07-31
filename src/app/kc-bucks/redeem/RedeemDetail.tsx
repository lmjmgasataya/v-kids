"use client";

import { useRouter } from "next/navigation";
import { RedeemForm } from "./RedeemForm";
import type { KcBucksKid } from "../actions";

export function RedeemDetail({ kid, initialBalance }: { kid: KcBucksKid; initialBalance: number }) {
  const router = useRouter();

  function backToSearch() {
    router.push("/kc-bucks/redeem");
  }

  return <RedeemForm kid={kid} initialBalance={initialBalance} onDone={backToSearch} />;
}
