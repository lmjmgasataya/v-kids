"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5QrcodeScanner } from "html5-qrcode";

export function QrScanner({ onDecode }: { onDecode: (text: string) => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const onDecodeRef = useRef(onDecode);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5QrcodeScanner, Html5QrcodeScanType }) => {
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 20,
          qrbox: { width: 250, height: 250 },
          videoConstraints: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false
      );
      scanner.render(
        (decodedText) => {
          scanner.pause(true);
          setPaused(true);
          onDecodeRef.current(decodedText);
        },
        () => {}
      );
      scannerRef.current = scanner;
    });

    return () => {
      cancelled = true;
      scannerRef.current?.clear().catch(() => {});
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
