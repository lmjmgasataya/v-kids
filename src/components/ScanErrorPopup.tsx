"use client";

import type { ReactNode } from "react";
import { useCloseOnKey } from "./useCloseOnKey";
import { useCountdown } from "./useCountdown";

// Full-screen popup for a scan/lookup error (e.g. "already checked in", "no
// kid found") — auto-dismisses on its own after 5s so it doesn't have to be
// manually cleared before the next scan. Also closeable via the Close button
// or by pressing Space/Enter.
export function ScanErrorPopup({ message, onClose }: { message: ReactNode; onClose: () => void }) {
  const secondsLeft = useCountdown(5, onClose);
  useCloseOnKey(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-card-pop-in w-full max-w-sm rounded-2xl border-4 border-t-kids-magenta border-r-kids-navy border-b-kids-green border-l-kids-yellow bg-white p-6 shadow-xl ring-1 ring-black/5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">⚠️</span>
          <p className="text-base text-gray-700 pt-0.5">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="self-center flex items-center gap-2 rounded-full bg-kids-navy px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          Close ({secondsLeft})
        </button>
      </div>
    </div>
  );
}
