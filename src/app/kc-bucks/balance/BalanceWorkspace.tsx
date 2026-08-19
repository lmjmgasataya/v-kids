"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { QrScanner, playSuccessSound } from "@/components/QrScanner";
import { useHardwareScanListener } from "@/components/useHardwareScanListener";
import { ScanningPopup } from "@/components/ScanningPopup";
import { ScanErrorPopup } from "@/components/ScanErrorPopup";
import { inputCls } from "@/components/form";
import { resolveKidBasicByQrToken } from "../actions";
import { searchKidsWithBalance, type KidBalanceSearchResult } from "./actions";
import { capitalizeName } from "@/lib/format";
import { SERVICE_OPTIONS } from "@/lib/constants";

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
  const initialService = searchParams.get("service") ?? "";

  const [mode, setMode] = useState<"search" | "scan">(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [service, setService] = useState(initialService);
  const [results, setResults] = useState<KidBalanceSearchResult[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [hwScanBusy, setHwScanBusy] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(value: string, serviceValue: string) {
    startSearch(async () => {
      const rows = await searchKidsWithBalance(value, serviceValue);
      setResults(rows);
    });
  }

  useEffect(() => {
    // Preload the alphabetical kid list (or the query/filter the page loaded with,
    // e.g. returning via back button) — later changes are handled by their own handlers.
    runSearch(initialQuery, initialService);
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
      runSearch(next, service);
    }, 300);
  }

  function handleServiceChange(next: string) {
    setService(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("service", next);
    else params.delete("service");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    runSearch(query, next);
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
          <div className="flex gap-2">
            <input
              type="search"
              placeholder="Search kids by name…"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={inputCls}
            />
            <select
              value={service}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kids-navy/40 focus:border-transparent"
            >
              <option value="">All services</option>
              {SERVICE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {isSearching && <p className="text-xs text-gray-400">Searching…</p>}
          {!isSearching && results.length === 0 && (
            <p className="text-xs text-gray-400">No matching kids found.</p>
          )}
          {results.length > 0 && (
            <ul className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-y-auto max-h-96">
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
        </div>
      )}

      {scanError && <ScanErrorPopup message={scanError} onClose={() => setScanError(null)} />}
      {hwScanBusy && <ScanningPopup />}
    </div>
  );
}
