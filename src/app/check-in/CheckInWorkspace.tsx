"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { checkInKid, checkOutKid, resolveQrToken, searchKidsForCheckIn } from "./actions";
import type { CheckInSearchResult, OpenCheckInSummary } from "@/lib/checkIn";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { inputCls } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { QrScanner } from "@/components/QrScanner";

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

function EmojiBurst({ triggerKey, emoji }: { triggerKey: number; emoji: string }) {
  if (!triggerKey) return null;
  const particles = Array.from({ length: 8 });
  return (
    <span key={triggerKey} className="pointer-events-none absolute inset-0">
      {particles.map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 text-lg animate-emoji-burst"
          style={{ "--burst-angle": `${(360 / particles.length) * i}deg` } as React.CSSProperties}
        >
          {emoji}
        </span>
      ))}
    </span>
  );
}

function SearchPanel({
  intent,
  service,
  onSelect,
}: {
  intent: Intent;
  service: string;
  onSelect: (kid: CheckInSearchResult) => void;
}) {
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

  const filtered = results.filter((kid) =>
    intent === "checkin"
      ? !kid.openCheckIn && !kid.checkedInServicesToday.includes(service)
      : kid.openCheckIn?.serviceAttending === service
  );

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
                  <span className="text-xs font-semibold text-kids-green bg-kids-green/10 rounded-full px-2 py-1 whitespace-nowrap shrink-0">
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

function CheckInForm({ kid, service, onDone }: { kid: CheckInSearchResult; service: string; onDone: () => void }) {
  const checkInWithId = checkInKid.bind(null, kid.id);
  const [state, action] = useActionState(checkInWithId, undefined);
  const [burst, setBurst] = useState(0);

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
      <form action={action} onSubmit={() => setBurst((b) => b + 1)} className="flex flex-col gap-3">
        <input type="hidden" name="serviceAttending" value={service} />
        <p className="text-sm text-gray-700">
          Checking in to <span className="font-semibold">{service}</span>.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea name="remarks" rows={2} maxLength={500} className={inputCls} />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="relative">
          <SubmitButton
            label="Check in"
            pendingLabel="Checking in…"
            icon="✅"
            className="w-full bg-kids-green hover:bg-kids-green/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white font-bold py-2.5 rounded-xl transition-[transform,background-color,opacity] duration-150"
          />
          <EmojiBurst triggerKey={burst} emoji="🎉" />
        </div>
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
  const [burst, setBurst] = useState(0);

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
      <form action={action} onSubmit={() => setBurst((b) => b + 1)} className="flex flex-col gap-3">
        <input type="hidden" name="service" value={openCheckIn.serviceAttending} />
        <p className="text-sm text-gray-700">
          Currently checked in to <span className="font-semibold">{openCheckIn.serviceAttending}</span> since{" "}
          {timeFormatter.format(openCheckIn.checkedInAt)}.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea name="remarks" rows={2} maxLength={500} className={inputCls} />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="relative">
          <SubmitButton
            label="Check out"
            pendingLabel="Checking out…"
            icon="👋"
            className="w-full bg-kids-magenta hover:bg-kids-magenta/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white font-bold py-2.5 rounded-xl transition-[transform,background-color,opacity] duration-150"
          />
          <EmojiBurst triggerKey={burst} emoji="✨" />
        </div>
      </form>
    </div>
  );
}

export function CheckInWorkspace({
  initialToken,
  initialService,
  initialIntent,
}: {
  initialToken?: string;
  initialService?: string;
  initialIntent?: Intent;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [intent, setIntent] = useState<Intent>(initialIntent ?? "checkin");
  const [mode, setMode] = useState<"search" | "scan">("search");
  const [service, setServiceState] = useState<string>(initialService ?? SERVICE_OPTIONS[0]);
  const [selectedKid, setSelectedKid] = useState<CheckInSearchResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const updateUrlParams = useCallback(
    (nextService: string, nextIntent: Intent) => {
      const params = new URLSearchParams();
      params.set("service", nextService);
      params.set("intent", nextIntent);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  const setService = useCallback(
    (next: string) => {
      setServiceState(next);
      updateUrlParams(next, intent);
    },
    [updateUrlParams, intent]
  );

  function switchIntent(next: Intent) {
    setIntent(next);
    setSelectedKid(null);
    setScanError(null);
    updateUrlParams(service, next);
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
    if (forIntent === "checkin" && kid.checkedInServicesToday.includes(service)) {
      setScanError(`${kid.firstName} has already checked in to ${service} today.`);
      return;
    }
    if (forIntent === "checkout" && !kid.openCheckIn) {
      setScanError(`${kid.firstName} is not currently checked in.`);
      return;
    }
    if (forIntent === "checkout" && kid.openCheckIn && kid.openCheckIn.serviceAttending !== service) {
      setScanError(`${kid.firstName} is checked in to ${kid.openCheckIn.serviceAttending}, not ${service}.`);
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
      const kid = result.kid;
      if (kid.openCheckIn) {
        setIntent("checkout");
        setServiceState(kid.openCheckIn.serviceAttending);
        updateUrlParams(kid.openCheckIn.serviceAttending, "checkout");
      } else {
        setIntent("checkin");
        setServiceState(kid.defaultService);
        updateUrlParams(kid.defaultService, "checkin");
      }
      setSelectedKid(kid);
    });
    return () => {
      cancelled = true;
    };
  }, [initialToken, updateUrlParams]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
        {intent === "checkin" ? "Check-In" : "Check-Out"}
      </h2>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchIntent("checkin")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-[transform,background-color,color] duration-150 active:scale-90 ${
            intent === "checkin" ? "bg-kids-green text-white scale-105" : "bg-gray-100 text-gray-500"
          }`}
        >
          ✅ Check In
        </button>
        <button
          type="button"
          onClick={() => switchIntent("checkout")}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-[transform,background-color,color] duration-150 active:scale-90 ${
            intent === "checkout" ? "bg-kids-magenta text-white scale-105" : "bg-gray-100 text-gray-500"
          }`}
        >
          👋 Check Out
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
        <select
          value={service}
          onChange={(e) => {
            setService(e.target.value);
            setSelectedKid(null);
            setScanError(null);
          }}
          className={inputCls}
        >
          {SERVICE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
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

      {mode === "search" && <SearchPanel intent={intent} service={service} onSelect={setSelectedKid} />}
      {mode === "scan" && (
        <div className="flex flex-col gap-2">
          <QrScanner onDecode={(text) => resolveToken(text, intent)} />
          {scanError && <p className="text-sm text-red-600">{scanError}</p>}
        </div>
      )}

      {selectedKid && intent === "checkin" && (
        <CheckInForm kid={selectedKid} service={service} onDone={() => setSelectedKid(null)} />
      )}
      {selectedKid && intent === "checkout" && selectedKid.openCheckIn && (
        <CheckOutForm kid={selectedKid} openCheckIn={selectedKid.openCheckIn} onDone={() => setSelectedKid(null)} />
      )}
    </div>
  );
}
