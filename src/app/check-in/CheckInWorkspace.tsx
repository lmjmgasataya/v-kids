"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { checkInKid, checkOutKid, resolveQrToken, searchKidsForCheckIn } from "./actions";
import type { CheckInSearchResult, OpenCheckInSummary } from "@/lib/checkIn";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { Select, inputCls } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { QrScanner } from "./QrScanner";

type Intent = "checkin" | "checkout";

function parseQrToken(decodedText: string): string {
  try {
    const url = new URL(decodedText);
    return url.searchParams.get("token") ?? decodedText;
  } catch {
    return decodedText;
  }
}

const timeFormatter = new Intl.DateTimeFormat("en-PH", { timeStyle: "short" });

function SearchPanel({ intent, onSelect }: { intent: Intent; onSelect: (kid: CheckInSearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckInSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setQuery(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        const rows = await searchKidsForCheckIn(next);
        setResults(rows);
      });
    }, 300);
  }

  const filtered = results.filter((kid) => (intent === "checkin" ? !kid.openCheckIn : kid.openCheckIn));

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder={intent === "checkin" ? "Search kids to check in…" : "Search kids to check out…"}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        className={inputCls}
      />
      {isPending && <p className="text-xs text-gray-400">Searching…</p>}
      {!isPending && query.trim() && filtered.length === 0 && (
        <p className="text-xs text-gray-400">
          {intent === "checkin" ? "No matching kids available to check in." : "No matching kids are currently checked in."}
        </p>
      )}
      {filtered.length > 0 && (
        <ul className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {filtered.map((kid) => (
            <li key={kid.id}>
              <button
                type="button"
                onClick={() => onSelect(kid)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-kids-yellow/5"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {kid.firstName} {kid.lastName}
                    {kid.nickname && <span className="text-xs text-gray-400"> &quot;{kid.nickname}&quot;</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    Age {kid.age} · {kid.defaultService}
                  </div>
                </div>
                {kid.openCheckIn && (
                  <span className="text-xs font-semibold text-kids-green bg-kids-green/10 rounded-full px-2 py-1">
                    Checked in
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CheckInForm({ kid, onDone }: { kid: CheckInSearchResult; onDone: () => void }) {
  const checkInWithId = checkInKid.bind(null, kid.id);
  const [state, action] = useActionState(checkInWithId, undefined);

  return (
    <div className="rounded-2xl border-2 border-kids-green/30 bg-kids-green/5 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-kids-navy">
            {kid.firstName} {kid.lastName}
          </div>
          <div className="text-xs text-gray-500">Age {kid.age}</div>
        </div>
        <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-kids-navy">
          Close
        </button>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <Select label="Service" name="serviceAttending" options={SERVICE_OPTIONS} defaultValue={kid.defaultService} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea name="remarks" rows={2} maxLength={500} className={inputCls} />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton
          label="Check in"
          pendingLabel="Checking in…"
          className="bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
        />
      </form>
    </div>
  );
}

function CheckOutForm({
  kid,
  openCheckIn,
  onDone,
}: {
  kid: CheckInSearchResult;
  openCheckIn: OpenCheckInSummary;
  onDone: () => void;
}) {
  const checkOutWithId = checkOutKid.bind(null, openCheckIn.id);
  const [state, action] = useActionState(checkOutWithId, undefined);

  return (
    <div className="rounded-2xl border-2 border-kids-magenta/30 bg-kids-magenta/5 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-kids-navy">
            {kid.firstName} {kid.lastName}
          </div>
          <div className="text-xs text-gray-500">Age {kid.age}</div>
        </div>
        <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-kids-navy">
          Close
        </button>
      </div>
      <form action={action} className="flex flex-col gap-3">
        <p className="text-sm text-gray-700">
          Currently checked in to <span className="font-semibold">{openCheckIn.serviceAttending}</span> since{" "}
          {timeFormatter.format(openCheckIn.checkedInAt)}.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea name="remarks" rows={2} maxLength={500} className={inputCls} />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton
          label="Check out"
          pendingLabel="Checking out…"
          className="bg-kids-magenta hover:bg-kids-magenta/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
        />
      </form>
    </div>
  );
}

export function CheckInWorkspace({ initialToken }: { initialToken?: string }) {
  const [intent, setIntent] = useState<Intent>("checkin");
  const [mode, setMode] = useState<"search" | "scan">("search");
  const [selectedKid, setSelectedKid] = useState<CheckInSearchResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  function switchIntent(next: Intent) {
    setIntent(next);
    setSelectedKid(null);
    setScanError(null);
  }

  function switchMode(next: "search" | "scan") {
    setMode(next);
    setSelectedKid(null);
    setScanError(null);
  }

  async function resolveToken(decodedText: string, forIntent: Intent) {
    setScanError(null);
    setSelectedKid(null);
    const result = await resolveQrToken(parseQrToken(decodedText));
    if ("error" in result) {
      setScanError(result.error);
      return;
    }
    const kid = result.kid;
    if (forIntent === "checkin" && kid.openCheckIn) {
      setScanError(
        `${kid.firstName} is already checked in to ${kid.openCheckIn.serviceAttending} since ${timeFormatter.format(
          kid.openCheckIn.checkedInAt
        )}. Switch to Check Out to check them out.`
      );
      return;
    }
    if (forIntent === "checkout" && !kid.openCheckIn) {
      setScanError(`${kid.firstName} is not currently checked in.`);
      return;
    }
    setSelectedKid(kid);
  }

  useEffect(() => {
    if (!initialToken) return;
    let cancelled = false;
    resolveQrToken(parseQrToken(initialToken)).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setScanError(result.error);
        return;
      }
      setIntent(result.kid.openCheckIn ? "checkout" : "checkin");
      setSelectedKid(result.kid);
    });
    return () => {
      cancelled = true;
    };
  }, [initialToken]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchIntent("checkin")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            intent === "checkin" ? "bg-kids-green text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          Check In
        </button>
        <button
          type="button"
          onClick={() => switchIntent("checkout")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
            intent === "checkout" ? "bg-kids-magenta text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          Check Out
        </button>
      </div>

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

      {mode === "search" && <SearchPanel intent={intent} onSelect={setSelectedKid} />}
      {mode === "scan" && (
        <div className="flex flex-col gap-2">
          <QrScanner onDecode={(text) => resolveToken(text, intent)} />
          {scanError && <p className="text-sm text-red-600">{scanError}</p>}
        </div>
      )}

      {selectedKid && intent === "checkin" && <CheckInForm kid={selectedKid} onDone={() => setSelectedKid(null)} />}
      {selectedKid && intent === "checkout" && selectedKid.openCheckIn && (
        <CheckOutForm kid={selectedKid} openCheckIn={selectedKid.openCheckIn} onDone={() => setSelectedKid(null)} />
      )}
    </div>
  );
}
