"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";

export function QrScanner({ onDecode }: { onDecode: (text: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onDecodeRef = useRef(onDecode);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(async ({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      const config = {
        fps: 20,
        qrbox: { width: 250, height: 250 },
        videoConstraints: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const onSuccess = (decodedText: string) => {
        scanner.pause(true);
        setPaused(true);
        onDecodeRef.current(decodedText);
      };
      const onError = () => {};

      // Force the rear/environment lens directly via constraint instead of
      // relying on html5-qrcode's device-list picker, which on iOS Safari
      // can select "back camera" without actually switching the stream.
      try {
        await scanner.start({ facingMode: { exact: "environment" } }, config, onSuccess, onError);
      } catch {
        if (cancelled) return;
        try {
          await scanner.start({ facingMode: "environment" }, config, onSuccess, onError);
        } catch {
          if (!cancelled) await scanner.start({ facingMode: "user" }, config, onSuccess, onError);
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
      {paused && (
        <button
          type="button"
          onClick={() => {
            scannerRef.current?.resume();
            setPaused(false);
          }}
          className="text-sm font-semibold text-kids-navy hover:underline self-start"
        >
          Scan another
        </button>
      )}
    </div>
  );
}
