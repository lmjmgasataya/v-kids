"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getKidGrants, type GrantEntry } from "./actions";
import { GrantEditRow } from "./GrantEditRow";
import type { KcBucksKid } from "../actions";

export function EditGrantsDetail({ kid, initialGrants }: { kid: KcBucksKid; initialGrants: GrantEntry[] }) {
  const router = useRouter();
  const [grants, setGrants] = useState<GrantEntry[]>(initialGrants);
  const [isLoading, startLoading] = useTransition();

  function refresh() {
    startLoading(async () => {
      const rows = await getKidGrants(kid.id);
      setGrants(rows);
    });
  }

  return (
    <div className="rounded-2xl border-2 border-kids-green/30 bg-kids-green/5 p-6 flex flex-col gap-4 scroll-mt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-kids-navy">
            {kid.firstName} {kid.lastName}
            {kid.nickname && <span className="text-xl text-black"> &quot;{kid.nickname}&quot;</span>}
          </div>
          <div className="text-xs text-gray-500">Age {kid.age}</div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/kc-bucks/edit-grants")}
          className="text-sm text-gray-400 hover:text-kids-navy"
        >
          Change kid
        </button>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading grants…</p>}

      {!isLoading && grants.length === 0 && (
        <p className="text-sm text-gray-400">No manually granted credits yet.</p>
      )}

      {grants.length > 0 && (
        <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {grants.map((grant) => (
            <GrantEditRow key={grant.id} grant={grant} onChanged={refresh} />
          ))}
        </ul>
      )}
    </div>
  );
}
