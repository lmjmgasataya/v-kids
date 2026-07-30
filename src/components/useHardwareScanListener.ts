"use client";

import { useEffect, useRef } from "react";

// Hardware (keyboard-wedge) QR scanners just "type" the decoded text followed
// by Enter, as fast keystrokes, wherever focus happens to be. Listen globally,
// but only while nothing is genuinely focused (so normal typing elsewhere,
// e.g. a search box or the remarks textarea, is never touched) and only
// while enabled. A burst is only treated as a scan if it arrives far faster
// than a human could type, since we have no fixed prefix to match against.
export function useHardwareScanListener(onScan: (text: string) => void, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const onScanRef = useRef(onScan);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    let buffer = "";
    let lastTime = 0;

    function isTypingInField(): boolean {
      const active = document.activeElement;
      if (!active || active === document.body) return false;
      const tag = active.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || active.getAttribute("contenteditable") === "true";
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (!enabledRef.current || isTypingInField()) return;

      const now = Date.now();
      if (now - lastTime > 75) buffer = "";
      lastTime = now;

      if (e.key === "Enter") {
        const candidate = buffer;
        buffer = "";
        if (candidate.length >= 8) {
          e.preventDefault();
          onScanRef.current(candidate);
        }
        return;
      }

      if (e.key.length !== 1) return;
      buffer += e.key;
      if (buffer.length > 500) buffer = buffer.slice(-500);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
