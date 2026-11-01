"use client";

import { useState } from "react";
import { QrScanner } from "@/components/QrScanner";
import { checkScannedQr, type QrCheckResult } from "./actions";

const timeFormatter = new Intl.DateTimeFormat("en-PH", { timeStyle: "medium", timeZone: "Asia/Manila" });

type ScanEntry = { at: Date; result: QrCheckResult };

function ResultCard({ result }: { result: QrCheckResult }) {
  if (result.kind === "error") {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{result.error}</div>;
  }

  const matched = result.kind !== "unknown";
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 ${
        matched ? "border-kids-green/40 bg-kids-green/10" : "border-kids-yellow/60 bg-kids-yellow/10"
      }`}
    >
      {result.kind === "team" &&
        (result.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- private photo route, not a static asset
          <img src={result.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gray-100 shrink-0" />
        ))}
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="font-bold text-kids-navy">
          {result.kind === "team" && `✓ QR read · Service team: ${result.name}`}
          {result.kind === "kid" && `✓ QR read · Kid: ${result.name}`}
          {result.kind === "unknown" && "QR read, but it doesn't match any card"}
        </span>
        <span className="text-xs text-gray-500 break-all">{result.raw}</span>
      </div>
    </div>
  );
}

export function CheckStmWorkspace() {
  const [scans, setScans] = useState<ScanEntry[]>([]);

  async function handleDecode(text: string) {
    const result = await checkScannedQr(text);
    setScans((prev) => [{ at: new Date(), result }, ...prev].slice(0, 10));
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Check STM QR</h3>
        <p className="text-sm text-gray-500">
          Scan a printed service team ID to confirm the QR still reads with the photo in the middle. Read-only —
          nobody is checked in.
        </p>
      </div>

      <div className="w-full max-w-sm mx-auto">
        <QrScanner onDecode={handleDecode} />
      </div>

      {scans.length > 0 && (
        <div className="flex flex-col gap-2">
          <ResultCard result={scans[0].result} />
          {scans.length > 1 && (
            <ul className="flex flex-col gap-1 text-xs text-gray-500">
              {scans.slice(1).map((scan, i) => (
                <li key={i}>
                  {timeFormatter.format(scan.at)} ·{" "}
                  {scan.result.kind === "team" || scan.result.kind === "kid"
                    ? `${scan.result.kind === "team" ? "Service team" : "Kid"}: ${scan.result.name}`
                    : scan.result.kind === "unknown"
                      ? "No match"
                      : scan.result.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
