"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

function playSuccessSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(700, ctx.currentTime);
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // AudioContext not available
  }
}

export function QrScanner({
  onDecode,
  onScanAgain,
}: {
  onDecode: (text: string) => void | Promise<void>;
  onScanAgain?: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onDecodeRef = useRef(onDecode);
  const [paused, setPaused] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const baseConfig = {
        fps: 20,
        qrbox: { width: 250, height: 250 },
      };
      const onSuccess = (decodedText: string) => {
        scanner.pause(true);
        setPaused(true);
        playSuccessSound();
        setResolving(true);
        Promise.resolve(onDecodeRef.current(decodedText)).finally(() => setResolving(false));
      };
      const onError = () => {};

      // When `videoConstraints` is set, html5-qrcode uses it verbatim as the
      // getUserMedia constraints and ignores any facingMode passed as the
      // `cameraIdOrConfig` first argument — so facingMode must live inside
      // videoConstraints itself to actually force the rear/environment lens.
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            ...baseConfig,
            videoConstraints: {
              facingMode: { exact: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          onSuccess,
          onError
        );
      } catch {
        if (cancelled) return;
        try {
          await scanner.start(
            { facingMode: "environment" },
            {
              ...baseConfig,
              videoConstraints: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            onSuccess,
            onError
          );
        } catch {
          if (!cancelled) {
            await scanner.start({ facingMode: "user" }, baseConfig, onSuccess, onError);
          }
        }
      }
    });

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div id="qr-reader" className="rounded-2xl overflow-hidden border border-gray-200" />
      {paused && resolving && (
        <div className="flex items-center justify-center gap-2.5 pt-4 pb-1" aria-label="Looking up scan result…">
          <span className="w-4 h-4 rounded-full bg-kids-magenta animate-bounce [animation-delay:-0.3s]" />
          <span className="w-4 h-4 rounded-full bg-kids-yellow animate-bounce [animation-delay:-0.2s]" />
          <span className="w-4 h-4 rounded-full bg-kids-green animate-bounce [animation-delay:-0.1s]" />
          <span className="w-4 h-4 rounded-full bg-kids-navy animate-bounce" />
        </div>
      )}
      {paused && !resolving && (
        <button
          type="button"
          onClick={() => {
            scannerRef.current?.resume();
            setPaused(false);
            onScanAgain?.();
          }}
          className="self-center flex items-center gap-2 rounded-full bg-kids-navy px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-md active:scale-95"
        >
          <span className="text-base leading-none">🔄</span>
          Scan another
        </button>
      )}
    </div>
  );
}
