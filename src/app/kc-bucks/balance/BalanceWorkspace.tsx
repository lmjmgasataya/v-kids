"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { QrScanner } from "@/components/QrScanner";
import { inputCls } from "@/components/form";
import { resolveKidBasicByQrToken, type KcBucksKid } from "../actions";
import {
  getKidBalanceSummary,
  searchKidsWithBalance,
  type KidBalanceSearchResult,
  type KidBalanceSummary,
} from "./actions";

function parseQrToken(decodedText: string): string {
  try {
    const url = new URL(decodedText);
    return url.searchParams.get("token") ?? decodedText;
  } catch {
    return decodedText;
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

const TYPE_LABEL: Record<string, string> = {
  checkin: "Check-in",
  grant: "Grant",
  redemption: "Redemption",
};

export function BalanceWorkspace({ initialKid }: { initialKid?: KcBucksKid | null }) {
  const [mode, setMode] = useState<"search" | "scan">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KidBalanceSearchResult[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [kid, setKid] = useState<KcBucksKid | null>(null);
  const [summary, setSummary] = useState<KidBalanceSummary | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingDetail, startDetail] = useTransition();

  function handleSearchChange(next: string) {
    setQuery(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      startSearch(async () => {
        const rows = await searchKidsWithBalance(next);
        setResults(rows);
      });
    }, 300);
  }

  function loadDetail(nextKid: KcBucksKid) {
    setKid(nextKid);
    setSummary(null);
    setDetailError(null);
    startDetail(async () => {
      const result = await getKidBalanceSummary(nextKid.id);
      if ("error" in result) {
        setDetailError(result.error);
        return;
      }
      setSummary(result);
    });
  }

  useEffect(() => {
    if (initialKid) loadDetail(initialKid);
    // Only run for the kid the page loaded with — later prop changes (there are none) shouldn't re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDecode(decodedText: string) {
    setScanError(null);
    const result = await resolveKidBasicByQrToken(parseQrToken(decodedText));
    if ("error" in result) {
      setScanError(result.error);
      return;
    }
    loadDetail(result.kid);
  }

  function reset() {
    setKid(null);
    setSummary(null);
    setDetailError(null);
  }

  if (kid) {
    return (
      <div className="rounded-2xl border-2 border-kids-yellow/40 bg-kids-yellow/5 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-kids-navy">
              {kid.firstName} {kid.lastName}
            </div>
            <div className="text-xs text-gray-500">Age {kid.age}</div>
          </div>
          <button type="button" onClick={reset} className="text-sm text-gray-400 hover:text-kids-navy">
            Back to search
          </button>
        </div>

        {isLoadingDetail && <p className="text-sm text-gray-400">Loading balance…</p>}
        {detailError && <p className="text-sm text-red-600">{detailError}</p>}

        {summary && (
          <>
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
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            mode === "search" ? "bg-kids-navy text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setMode("scan")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            mode === "scan" ? "bg-kids-navy text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          Scan QR
        </button>
      </div>

      {mode === "search" && (
        <div className="flex flex-col gap-3">
          <input
            type="search"
            placeholder="Search kids by name…"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={inputCls}
          />
          {isSearching && <p className="text-xs text-gray-400">Searching…</p>}
          {!isSearching && query.trim() && results.length === 0 && (
            <p className="text-xs text-gray-400">No matching kids found.</p>
          )}
          {results.length > 0 && (
            <ul className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => loadDetail(result)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-kids-yellow/5"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {result.firstName} {result.lastName}
                        {result.nickname && <span className="text-xs text-gray-400"> &quot;{result.nickname}&quot;</span>}
                      </div>
                      <div className="text-xs text-gray-400">Age {result.age}</div>
                    </div>
                    <span className="flex items-baseline gap-1 text-kids-navy">
                      <span className="text-base font-bold">{result.balance}</span>
                      <span className="text-xs font-normal text-gray-400">bucks</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === "scan" && (
        <div className="flex flex-col gap-2">
          <QrScanner onDecode={handleDecode} />
          {scanError && <p className="text-sm text-red-600">{scanError}</p>}
        </div>
      )}
    </div>
  );
}
