"use client";

import { useEffect } from "react";

// Lets a full-screen popup be dismissed with Space or Enter, in addition to
// its own close button/auto-dismiss timer.
export function useCloseOnKey(onClose: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
}
