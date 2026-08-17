"use client";

import { useEffect, useRef, useState } from "react";

// Ticks a countdown down to 0 once per second, then calls onExpire — powers
// the "Close (N)" button on auto-dismissing popups.
export function useCountdown(seconds: number, onExpire: () => void): number {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          onExpireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return secondsLeft;
}
