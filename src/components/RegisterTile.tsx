"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export function RegisterTile() {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pressed, setPressed] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) scale(1.02)`;
  }

  function handleMouseLeave() {
    if (ref.current) ref.current.style.transform = "";
    setPressed(false);
  }

  return (
    <Link
      ref={ref}
      href="/register"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        boxShadow: pressed
          ? "-4px 6px 12px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.12)"
          : "-10px 14px 24px rgba(0,0,0,0.32), 0 6px 14px rgba(0,0,0,0.18)",
      }}
      className="flex flex-col items-center gap-3 rounded-3xl bg-kids-magenta text-white p-8 transition-[transform,box-shadow] duration-200 ease-out will-change-transform"
    >
      <span className="text-5xl">📝</span>
      <span className="text-2xl font-bold font-[family-name:var(--font-fredoka)]">Register</span>
      <span className="text-sm text-white/80">Sign up a child for Kids Church</span>
    </Link>
  );
}
