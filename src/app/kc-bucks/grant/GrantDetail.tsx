"use client";

import { useRouter } from "next/navigation";
import { GrantForm } from "./GrantForm";
import type { KcBucksKid } from "../actions";

export function GrantDetail({ kid }: { kid: KcBucksKid }) {
  const router = useRouter();

  function backToSearch() {
    router.push("/kc-bucks/grant");
  }

  return <GrantForm kid={kid} onDone={backToSearch} onGranted={backToSearch} />;
}
