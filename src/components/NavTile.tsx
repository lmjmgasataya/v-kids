"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Color = "kids-magenta" | "kids-green" | "kids-navy" | "kids-yellow";

const BG_CLASS: Record<Color, string> = {
  "kids-magenta": "bg-kids-magenta",
  "kids-green": "bg-kids-green",
  "kids-navy": "bg-kids-navy",
  "kids-yellow": "bg-kids-yellow",
};

interface Props {
  href: string;
  icon: string;
  label: string;
  description: string;
  color: Color;
}

export function NavTile({ href, icon, label, description, color }: Props) {
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
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        boxShadow: pressed
          ? "-4px 6px 12px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.12)"
          : "-10px 14px 24px rgba(0,0,0,0.32), 0 6px 14px rgba(0,0,0,0.18)",
      }}
      className={`flex flex-col items-center gap-3 rounded-3xl text-white p-8 transition-[transform,box-shadow] duration-200 ease-out will-change-transform ${BG_CLASS[color]}`}
    >
      <span className="text-5xl">{icon}</span>
      <span className="text-2xl font-bold font-[family-name:var(--font-fredoka)]">{label}</span>
      <span className="text-sm text-white/80">{description}</span>
    </Link>
  );
}
