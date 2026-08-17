"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { checkInKid, checkOutKid, resolveQrToken } from "./actions";
import type { CheckInDirectoryEntry, CheckInSearchResult, OpenCheckInSummary } from "@/lib/checkIn";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { inputCls } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { QrScanner, playSuccessSound, type QrScannerHandle } from "@/components/QrScanner";
import { ScanningPopup } from "@/components/ScanningPopup";
import { ScanErrorPopup } from "@/components/ScanErrorPopup";
import { useCloseOnKey } from "@/components/useCloseOnKey";
import { useCountdown } from "@/components/useCountdown";
import { useHardwareScanListener } from "@/components/useHardwareScanListener";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import { capitalizeName } from "@/lib/format";

type Intent = "checkin" | "checkout";

function parseQrToken(decodedText: string): string {
  try {
    const url = new URL(decodedText);
    return url.searchParams.get("token") ?? decodedText;
  } catch {
    return decodedText;
  }
}

const timeFormatter = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" });
const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

// SERVICE_OPTIONS entries are "<time> - <place>" (e.g. "9AM - Mandurriao"); split for the
// two-line card display so the dash doesn't need to render.
function splitServiceLabel(option: string): [string, string] {
  const [time, place] = option.split(" - ");
  return [time, place ?? ""];
}

function Highlight({ children }: { children: ReactNode }) {
  return <span className="font-extrabold text-kids-navy">{children}</span>;
}

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

function QuickCheckInButton({ kidId, service }: { kidId: number; service: string }) {
  const checkInWithId = checkInKid.bind(null, kidId);
  const [state, action] = useActionState(checkInWithId, undefined);
  useToastOnResult(state);

  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="serviceAttending" value={service} />
      <SubmitButton
        label="Check in"
        pendingLabel="…"
        icon="✅"
        className="bg-kids-green hover:bg-kids-green/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-[transform,background-color,opacity] duration-150"
      />
    </form>
  );
}

function AutoCheckInButton({
  kid,
  onCheckIn,
}: {
  kid: CheckInSearchResult;
  onCheckIn: (kid: CheckInSearchResult) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await onCheckIn(kid);
        setPending(false);
      }}
      className="shrink-0 bg-kids-green hover:bg-kids-green/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-[transform,background-color,opacity] duration-150"
    >
      {pending ? "…" : "✅ Check in"}
    </button>
  );
}

function QuickCheckOutButton({ checkInId, service }: { checkInId: number; service: string }) {
  const checkOutWithId = checkOutKid.bind(null, checkInId);
  const [state, action] = useActionState(checkOutWithId, undefined);
  useToastOnResult(state);

  return (
    <form action={action} className="shrink-0">
      <input type="hidden" name="service" value={service} />
      <SubmitButton
        label="Check out"
        pendingLabel="…"
        icon="👋"
        className="bg-kids-magenta hover:bg-kids-magenta/90 active:scale-90 disabled:opacity-50 disabled:active:scale-100 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-[transform,background-color,opacity] duration-150"
      />
    </form>
  );
}

function SearchPanel({
  intent,
  service,
  directory,
  autoCheckInEnabled,
  onAutoCheckIn,
}: {
  intent: Intent;
  service: string;
  directory: CheckInDirectoryEntry[];
  autoCheckInEnabled: boolean;
  onAutoCheckIn: (kid: CheckInSearchResult) => Promise<void>;
}) {
  const [query, setQuery] = useState("");

  // Filtered entirely from the preloaded directory — no debounce, no server
  // round trip, results update on every keystroke.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return directory
      .filter(
        (kid) =>
          kid.firstName.toLowerCase().includes(q) ||
          kid.lastName.toLowerCase().includes(q) ||
          (kid.nickname?.toLowerCase().includes(q) ?? false)
      )
      .filter((kid) =>
        intent === "checkin"
          ? !kid.openCheckIn?.isToday && !kid.checkedInServicesToday.includes(service)
          : kid.openCheckIn?.serviceAttending === service
      )
      .slice(0, 10);
  }, [directory, query, intent, service]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder={intent === "checkin" ? "Search kids to check in…" : "Search kids to check out…"}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputCls}
      />
      {query.trim() && filtered.length === 0 && (
        <p className="text-xs text-gray-400">
          {intent === "checkin" ? "No matching kids available to check in." : "No matching kids are currently checked in."}
        </p>
      )}
      {filtered.length > 0 && (
        <ul className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {filtered.map((kid) => (
            <li key={kid.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-kids-yellow/5">
              <div>
                <div className="font-medium text-gray-900">
                  {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
                  {kid.nickname && <span className="text-xs text-gray-400"> &quot;{capitalizeName(kid.nickname)}&quot;</span>}
                </div>
                <div className="text-xs text-gray-400">
                  Age {kid.age} · {kid.defaultService}
                </div>
                {intent === "checkin" && kid.openCheckIn && !kid.openCheckIn.isToday && (
                  <div className="text-xs font-medium text-kids-magenta mt-0.5">
                    ⚠ Not yet checked out from {kid.openCheckIn.serviceAttending} on{" "}
                    {dateFormatter.format(kid.openCheckIn.checkedInAt)}
                  </div>
                )}
              </div>
              {intent === "checkin" ? (
                autoCheckInEnabled ? (
                  <AutoCheckInButton kid={kid} onCheckIn={onAutoCheckIn} />
                ) : (
                  <QuickCheckInButton kidId={kid.id} service={service} />
                )
              ) : (
                kid.openCheckIn && (
                  <QuickCheckOutButton checkInId={kid.openCheckIn.id} service={kid.openCheckIn.serviceAttending} />
                )
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CheckInForm({
  kid,
  service,
  mode,
  onDone,
}: {
  kid: CheckInSearchResult;
  service: string;
  mode: "search" | "scan";
  onDone: () => void;
}) {
  const checkInWithId = checkInKid.bind(null, kid.id);
  const [state, action] = useActionState(checkInWithId, undefined);
  const [burst, setBurst] = useState(0);
  const router = useRouter();
  useToastOnResult(state);

  useEffect(() => {
    // The scan flow's action returns success instead of redirecting (see checkInKid),
    // so refresh the roster data in place and close the card without navigating —
    // that's what keeps the camera mounted and the scroll position untouched.
    if (state?.success) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-card-pop-in w-full max-w-sm rounded-2xl border-4 border-t-kids-magenta border-r-kids-navy border-b-kids-green border-l-kids-yellow bg-white p-6 shadow-xl ring-1 ring-black/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-kids-navy">
              {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
              {kid.nickname && <span className="text-xl text-black"> &quot;{capitalizeName(kid.nickname)}&quot;</span>}
            </div>
            <div className="text-xs text-gray-500">Age {kid.age}</div>
          </div>
          <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-kids-navy">
            Close
          </button>
        </div>
        <form action={action} onSubmit={() => setBurst((b) => b + 1)} className="flex flex-col gap-3">
          <input type="hidden" name="serviceAttending" value={service} />
          <input type="hidden" name="mode" value={mode} />
          <p className="text-sm text-gray-700">
            Checking in to <span className="font-semibold">{service}</span>.
          </p>
          {kid.openCheckIn && !kid.openCheckIn.isToday && (
            <p className="text-xs text-kids-magenta">
              ⚠ Still shows as checked in to {kid.openCheckIn.serviceAttending} on{" "}
              {dateFormatter.format(kid.openCheckIn.checkedInAt)} — checking in now will close that out.
            </p>
          )}
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
    </div>
  );
}

function CheckOutForm({
  kid,
  openCheckIn,
  mode,
  onDone,
}: {
  kid: CheckInSearchResult;
  openCheckIn: OpenCheckInSummary;
  mode: "search" | "scan";
  onDone: () => void;
}) {
  const checkOutWithId = checkOutKid.bind(null, openCheckIn.id);
  const [state, action] = useActionState(checkOutWithId, undefined);
  const [burst, setBurst] = useState(0);
  const router = useRouter();
  useToastOnResult(state);

  useEffect(() => {
    // The scan flow's action returns success instead of redirecting (see checkOutKid),
    // so refresh the roster data in place and close the card without navigating —
    // that's what keeps the camera mounted and the scroll position untouched.
    if (state?.success) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-card-pop-in w-full max-w-sm rounded-2xl border-4 border-t-kids-magenta border-r-kids-navy border-b-kids-green border-l-kids-yellow bg-white p-6 shadow-xl ring-1 ring-black/5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-kids-navy">
              {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
              {kid.nickname && <span className="text-xl text-black"> &quot;{capitalizeName(kid.nickname)}&quot;</span>}
            </div>
            <div className="text-xs text-gray-500">Age {kid.age}</div>
          </div>
          <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-kids-navy">
            Close
          </button>
        </div>
        <form action={action} onSubmit={() => setBurst((b) => b + 1)} className="flex flex-col gap-3">
          <input type="hidden" name="service" value={openCheckIn.serviceAttending} />
          <input type="hidden" name="mode" value={mode} />
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
    </div>
  );
}

function CheckInSuccessPopup({ name, onClose }: { name: string; onClose: () => void }) {
  const secondsLeft = useCountdown(3, onClose);
  useCloseOnKey(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-card-pop-in w-full max-w-sm rounded-2xl border-4 border-t-kids-magenta border-r-kids-navy border-b-kids-green border-l-kids-yellow bg-white p-8 shadow-xl ring-1 ring-black/5 flex flex-col items-center gap-4 text-center">
        <svg viewBox="0 0 52 52" className="w-20 h-20" aria-hidden="true">
          <circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            strokeWidth="3"
            style={{ stroke: "var(--color-kids-green)" }}
            className="animate-checkmark-circle"
          />
          <path
            d="M14 27l7 7 16-16"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: "var(--color-kids-green)" }}
            className="animate-checkmark-check"
          />
        </svg>
        <p className="text-xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Hello {name}! You&apos;re checked in
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-kids-navy px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          Close ({secondsLeft})
        </button>
      </div>
    </div>
  );
}

export function CheckInWorkspace({
  initialToken,
  initialService,
  initialIntent,
  initialMode,
  serviceCardsEnabled,
  autoCheckInEnabled,
  directory,
}: {
  initialToken?: string;
  initialService?: string;
  initialIntent?: Intent;
  initialMode?: "search" | "scan";
  serviceCardsEnabled?: boolean;
  // When on, a scan or a search "Check in" tap commits the check-in right
  // away instead of opening the confirm card — see performAutoCheckIn.
  autoCheckInEnabled?: boolean;
  // Preloaded on the server (page.tsx) so scans/searches resolve from memory
  // instead of a per-interaction DB round trip. Refreshed whenever the server
  // page re-renders with fresh data, e.g. after router.refresh() on check-in/out.
  directory: CheckInDirectoryEntry[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [intent, setIntent] = useState<Intent>(initialIntent ?? "checkin");
  const [mode, setMode] = useState<"search" | "scan">(initialMode ?? "search");
  const [service, setServiceState] = useState<string>(initialService ?? SERVICE_OPTIONS[0]);
  const [selectedKid, setSelectedKid] = useState<CheckInSearchResult | null>(null);
  const [autoSuccessKid, setAutoSuccessKid] = useState<CheckInSearchResult | null>(null);
  const [scanError, setScanError] = useState<ReactNode | null>(null);
  const [hwScanBusy, setHwScanBusy] = useState(false);
  const modeButtonsRef = useRef<HTMLDivElement | null>(null);
  const qrScannerRef = useRef<QrScannerHandle | null>(null);

  const directoryByToken = useMemo(() => new Map(directory.map((kid) => [kid.qrToken, kid])), [directory]);

  const closePopup = useCallback(() => {
    setSelectedKid(null);
    if (mode === "scan") qrScannerRef.current?.resume();
  }, [mode]);

  const closeAutoSuccess = useCallback(() => {
    setAutoSuccessKid(null);
    if (mode === "scan") qrScannerRef.current?.resume();
  }, [mode]);

  // Always submitted as mode="scan" so checkInKid returns {success} instead
  // of redirecting — this keeps both scan and search-click auto check-ins
  // in place, showing the success popup rather than navigating away.
  const performAutoCheckIn = useCallback(
    async (kid: CheckInSearchResult) => {
      setScanError(null);
      const formData = new FormData();
      formData.set("serviceAttending", service);
      formData.set("mode", "scan");
      const result = await checkInKid(kid.id, undefined, formData);
      if (result?.error) {
        setScanError(result.error);
        return;
      }
      router.refresh();
      setAutoSuccessKid(kid);
    },
    [service, router]
  );

  useEffect(() => {
    // Recovers scroll position after checkInKid/checkOutKid redirect back to this
    // page on success. The App Router's own post-navigation scroll-to-top runs in an
    // effect above this component, which fires after ours — so scrolling immediately
    // here gets clobbered. Deferring past a couple of paints lets it win instead.
    if (initialMode !== "scan" || initialToken) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        modeButtonsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUrlParams = useCallback(
    (nextService: string, nextIntent: Intent, nextMode: "search" | "scan") => {
      const params = new URLSearchParams();
      params.set("service", nextService);
      params.set("intent", nextIntent);
      params.set("mode", nextMode);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname]
  );

  const setService = useCallback(
    (next: string) => {
      setServiceState(next);
      updateUrlParams(next, intent, mode);
    },
    [updateUrlParams, intent, mode]
  );

  function switchIntent(next: Intent) {
    setIntent(next);
    setSelectedKid(null);
    setScanError(null);
    updateUrlParams(service, next, mode);
  }

  function switchMode(next: "search" | "scan") {
    setMode(next);
    setSelectedKid(null);
    setScanError(null);
    updateUrlParams(service, intent, next);
  }

  async function resolveToken(decodedText: string, forIntent: Intent) {
    setScanError(null);
    setSelectedKid(null);
    const parsedToken = parseQrToken(decodedText);
    // Resolve from the preloaded directory when possible — falls back to the
    // server action for tokens not in the snapshot (e.g. a kid registered
    // after this page loaded) or malformed/non-matching scans.
    const local = directoryByToken.get(parsedToken);
    const result = local ? { kid: local } : await resolveQrToken(parsedToken);
    if ("error" in result) {
      setScanError(result.error);
      return;
    }
    const kid = result.kid;
    if (forIntent === "checkin" && kid.openCheckIn?.isToday) {
      setScanError(
        <>
          <Highlight>{capitalizeName(kid.firstName)}</Highlight> is already checked in to{" "}
          <Highlight>
            {kid.openCheckIn.serviceAttending} since {timeFormatter.format(kid.openCheckIn.checkedInAt)}
          </Highlight>
          . Switch to Check Out to check them out.
        </>
      );
      return;
    }
    if (forIntent === "checkin" && kid.checkedInServicesToday.includes(service)) {
      setScanError(
        <>
          <Highlight>{capitalizeName(kid.firstName)}</Highlight> has already checked in to <Highlight>{service}</Highlight> today.
        </>
      );
      return;
    }
    if (forIntent === "checkout" && !kid.openCheckIn) {
      setScanError(
        <>
          <Highlight>{capitalizeName(kid.firstName)}</Highlight> is not currently checked in.
        </>
      );
      return;
    }
    if (forIntent === "checkout" && kid.openCheckIn && kid.openCheckIn.serviceAttending !== service) {
      setScanError(
        <>
          <Highlight>{capitalizeName(kid.firstName)}</Highlight> is checked in to{" "}
          <Highlight>{kid.openCheckIn.serviceAttending}</Highlight>, not <Highlight>{service}</Highlight>.
        </>
      );
      return;
    }
    if (forIntent === "checkin" && autoCheckInEnabled) {
      await performAutoCheckIn(kid);
      return;
    }
    setSelectedKid(kid);
  }

  // Mode "search" has no camera to drive the scanner off of, but a hardware
  // (keyboard-wedge) QR scanner still just "types" the decoded text — so
  // listen for it here too, gated off while a popup/error is already showing
  // or a previous scan is still resolving.
  useHardwareScanListener(
    async (text) => {
      setHwScanBusy(true);
      playSuccessSound();
      try {
        await resolveToken(text, intent);
      } finally {
        setHwScanBusy(false);
      }
    },
    { enabled: mode === "search" && !selectedKid && !scanError && !autoSuccessKid && !hwScanBusy }
  );

  useEffect(() => {
    if (!initialToken) return;
    let cancelled = false;
    const parsedToken = parseQrToken(initialToken);
    const local = directoryByToken.get(parsedToken);
    const lookup = local ? Promise.resolve({ kid: local }) : resolveQrToken(parsedToken);
    lookup.then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setScanError(result.error);
        return;
      }
      const kid = result.kid;
      setMode("scan");
      if (kid.openCheckIn?.isToday) {
        setIntent("checkout");
        setServiceState(kid.openCheckIn.serviceAttending);
        updateUrlParams(kid.openCheckIn.serviceAttending, "checkout", "scan");
      } else {
        setIntent("checkin");
        setServiceState(kid.defaultService);
        updateUrlParams(kid.defaultService, "checkin", "scan");
      }
      setSelectedKid(kid);
    });
    return () => {
      cancelled = true;
    };
    // Deliberately excludes directoryByToken — this deep-link resolution
    // should only run once on mount, against whatever directory loaded then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken, updateUrlParams]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
        {intent === "checkin" ? "Check-In" : "Check-Out"}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => switchIntent("checkin")}
          className={`group flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-4 transition-[transform,background-color,color,box-shadow,border-color] duration-150 active:scale-95 hover:-translate-y-1 hover:shadow-lg ${
            intent === "checkin"
              ? "bg-kids-green border-kids-green text-white shadow-md"
              : "bg-white border-gray-200 text-gray-500 hover:border-kids-green/50 hover:text-kids-green"
          }`}
        >
          <span className="text-2xl transition-transform duration-150 group-hover:scale-110">✅</span>
          <span className="text-sm font-bold">Check In</span>
        </button>
        <button
          type="button"
          onClick={() => switchIntent("checkout")}
          className={`group flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-4 transition-[transform,background-color,color,box-shadow,border-color] duration-150 active:scale-95 hover:-translate-y-1 hover:shadow-lg ${
            intent === "checkout"
              ? "bg-kids-magenta border-kids-magenta text-white shadow-md"
              : "bg-white border-gray-200 text-gray-500 hover:border-kids-magenta/50 hover:text-kids-magenta"
          }`}
        >
          <span className="text-2xl transition-transform duration-150 group-hover:scale-110">👋</span>
          <span className="text-sm font-bold">Check Out</span>
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
        {serviceCardsEnabled ? (
          <div className="flex gap-2 overflow-x-auto pt-2 pb-1">
            {SERVICE_OPTIONS.map((option) => {
              const [time, place] = splitServiceLabel(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setService(option);
                    setSelectedKid(null);
                    setScanError(null);
                  }}
                  className={`shrink-0 whitespace-nowrap rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-[transform,background-color,color,box-shadow,border-color] duration-150 active:scale-95 hover:-translate-y-0.5 hover:shadow-md ${
                    service === option
                      ? "bg-kids-navy border-kids-navy text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-500 hover:border-kids-navy/50 hover:text-kids-navy"
                  }`}
                >
                  <span className="block">{time}</span>
                  <span className="block">{place}</span>
                </button>
              );
            })}
          </div>
        ) : (
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
        )}
      </div>

      <div ref={modeButtonsRef} className="flex gap-2 scroll-mt-4">
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
        <SearchPanel
          intent={intent}
          service={service}
          directory={directory}
          autoCheckInEnabled={!!autoCheckInEnabled}
          onAutoCheckIn={performAutoCheckIn}
        />
      )}
      {mode === "scan" && (
        <QrScanner
          ref={qrScannerRef}
          onDecode={(text) => resolveToken(text, intent)}
          onScanAgain={() => {
            setSelectedKid(null);
            setScanError(null);
          }}
        />
      )}

      <div className="flex flex-col gap-2">
        {scanError && <ScanErrorPopup message={scanError} onClose={() => setScanError(null)} />}
        {selectedKid && intent === "checkin" && (
          <CheckInForm kid={selectedKid} service={service} mode={mode} onDone={closePopup} />
        )}
        {selectedKid && intent === "checkout" && selectedKid.openCheckIn && (
          <CheckOutForm
            kid={selectedKid}
            openCheckIn={selectedKid.openCheckIn}
            mode={mode}
            onDone={closePopup}
          />
        )}
        {autoSuccessKid && (
          <CheckInSuccessPopup
            name={capitalizeName(autoSuccessKid.nickname || autoSuccessKid.firstName)}
            onClose={closeAutoSuccess}
          />
        )}
        {hwScanBusy && <ScanningPopup />}
      </div>
    </div>
  );
}
