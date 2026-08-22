"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { KcBucksKid } from "../actions";
import { getKidGrants, type GrantEntry, type KidBalanceSummary } from "./actions";
import { GrantEditRow } from "./GrantEditRow";
import { capitalizeName } from "@/lib/format";

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const TYPE_LABEL: Record<string, string> = {
  checkin: "Check-in",
  grant: "Grant",
  redemption: "Redemption",
};

export function BalanceDetail({
  kid,
  summary,
  grants: initialGrants,
  canManageGrants,
}: {
  kid: KcBucksKid;
  summary: KidBalanceSummary;
  grants: GrantEntry[];
  canManageGrants: boolean;
}) {
  const router = useRouter();
  const [grants, setGrants] = useState(initialGrants);
  const [, startLoading] = useTransition();

  function refreshGrants() {
    startLoading(async () => {
      const rows = await getKidGrants(kid.id);
      setGrants(rows);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-kids-yellow/40 bg-kids-yellow/5 p-6 flex flex-col gap-4 scroll-mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-kids-navy">
              {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
              {kid.nickname && <span className="text-xl text-black"> &quot;{capitalizeName(kid.nickname)}&quot;</span>}
            </div>
            <div className="text-xs text-gray-500">Age {kid.age}</div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/kc-bucks/balances")}
            className="text-sm text-gray-400 hover:text-kids-navy"
          >
            Back to all balances
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
            {summary.balance}
          </span>
          <span className="text-sm text-gray-500">KC Bucks</span>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent activity</p>
          {summary.transactions.length === 0 ? (
            <p className="text-sm text-gray-400">No transactions yet.</p>
          ) : (
            <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
              {summary.transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div>
                    <div className="text-gray-900">{tx.reason}</div>
                    <div className="text-xs text-gray-400">
                      {TYPE_LABEL[tx.type]} · {dateTimeFormatter.format(tx.createdAt)}
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.amount >= 0 ? "text-kids-green" : "text-kids-magenta"}`}>
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {canManageGrants && (
        <div id="grants" className="rounded-2xl border-2 border-kids-green/30 bg-kids-green/5 p-6 flex flex-col gap-3 scroll-mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manual grants</p>
          {grants.length === 0 ? (
            <p className="text-sm text-gray-400">No manually granted credits yet.</p>
          ) : (
            <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
              {grants.map((grant) => (
                <GrantEditRow key={grant.id} grant={grant} onChanged={refreshGrants} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
