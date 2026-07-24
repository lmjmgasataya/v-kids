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

      const baseConfig = {
        fps: 20,
        qrbox: { width: 250, height: 250 },
      };
      const onSuccess = (decodedText: string) => {
        scanner.pause(true);
        setPaused(true);
        onDecodeRef.current(decodedText);
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
