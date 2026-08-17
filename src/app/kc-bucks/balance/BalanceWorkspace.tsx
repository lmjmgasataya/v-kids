"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { QrScanner, playSuccessSound } from "@/components/QrScanner";
import { useHardwareScanListener } from "@/components/useHardwareScanListener";
import { inputCls } from "@/components/form";
import { resolveKidBasicByQrToken } from "../actions";
import { searchKidsWithBalance, type KidBalanceSearchResult } from "./actions";
import { capitalizeName } from "@/lib/format";

function parseQrToken(decodedText: string): string {
  try {
    const url = new URL(decodedText);
    return url.searchParams.get("token") ?? decodedText;
  } catch {
    return decodedText;
  }
}

export function BalanceWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialMode = searchParams.get("mode") === "scan" ? "scan" : "search";

  const [mode, setMode] = useState<"search" | "scan">(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<KidBalanceSearchResult[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hwScanBusy, setHwScanBusy] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(value: string) {
    startSearch(async () => {
      const rows = await searchKidsWithBalance(value);
      setResults(rows);
    });
  }

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
    // Only re-run the search the page loaded with (e.g. returning via back button) — later
    // keystrokes are handled by handleSearchChange's own debounce, not this mount effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchChange(next: string) {
    setQuery(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Keep the query in the URL so it survives a back-navigation from the kid detail page.
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      runSearch(next);
    }, 300);
  }

  async function handleDecode(decodedText: string) {
    setScanError(null);
    const result = await resolveKidBasicByQrToken(parseQrToken(decodedText));
    if ("error" in result) {
      setScanError(result.error);
      return;
    }
    router.push(`/kc-bucks/balance/${result.kid.id}`);
  }

  // Mode "search" has no camera to drive the scanner off of, but a hardware
  // (keyboard-wedge) QR scanner still just "types" the decoded text — so
  // listen for it here too, gated off while a previous scan is still resolving.
  useHardwareScanListener(
    async (text) => {
      setHwScanBusy(true);
      playSuccessSound();
      try {
        await handleDecode(text);
      } finally {
        setHwScanBusy(false);
      }
    },
    { enabled: mode === "search" && !scanError && !hwScanBusy }
  );

  // Keep the active tab in the URL so it survives a back-navigation from the kid detail page.
  function switchMode(next: "search" | "scan") {
    setMode(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "scan") params.set("mode", "scan");
    else params.delete("mode");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("search")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            mode === "search" ? "bg-kids-navy text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => switchMode("scan")}
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
                    onClick={() => router.push(`/kc-bucks/balance/${result.id}`)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-kids-yellow/5"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {capitalizeName(result.firstName)} {capitalizeName(result.lastName)}
                        {result.nickname && <span className="text-xs text-gray-400"> &quot;{capitalizeName(result.nickname)}&quot;</span>}
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
          <QrScanner onDecode={handleDecode} onScanAgain={() => setScanError(null)} />
          {scanError && <p className="text-sm text-red-600">{scanError}</p>}
        </div>
      )}
    </div>
  );
}
