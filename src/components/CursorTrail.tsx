"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "var(--color-kids-magenta)",
  "var(--color-kids-navy)",
  "var(--color-kids-green)",
  "var(--color-kids-yellow)",
];

const SPACING = 10;

export function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorIndex = useRef(0);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function spawnDot(x: number, y: number) {
      const size = 8 + Math.random() * 6;
      const color = COLORS[colorIndex.current % COLORS.length];
      colorIndex.current++;

      const dot = document.createElement("span");
      dot.style.position = "fixed";
      dot.style.left = `${x - size / 2}px`;
      dot.style.top = `${y - size / 2}px`;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.borderRadius = "50%";
      dot.style.background = color;
      dot.style.pointerEvents = "none";
      dot.style.zIndex = "9998";
      dot.style.opacity = "0.75";
      dot.style.transform = "scale(1)";
      dot.style.transition = "transform 700ms ease-out, opacity 700ms ease-out";

      containerRef.current?.appendChild(dot);

      requestAnimationFrame(() => {
        dot.style.transform = "scale(0.2) translateY(12px)";
        dot.style.opacity = "0";
      });

      setTimeout(() => dot.remove(), 750);
    }

    function handleMove(e: MouseEvent) {
      const { clientX: x, clientY: y } = e;
      const prev = lastPoint.current;

      if (!prev) {
        lastPoint.current = { x, y };
        spawnDot(x, y);
        return;
      }

      const dx = x - prev.x;
      const dy = y - prev.y;
      const distance = Math.hypot(dx, dy);
      if (distance < SPACING) return;

      // Interpolate along the path so fast mouse movement (fewer events,
      // bigger jumps between them) still produces a continuous trail.
      const steps = Math.floor(distance / SPACING);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        spawnDot(prev.x + dx * t, prev.y + dy * t);
      }
      lastPoint.current = { x, y };
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return <div ref={containerRef} aria-hidden className="pointer-events-none" />;
}
