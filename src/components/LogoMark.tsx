interface Props {
  size?: number;
  className?: string;
}

const CELLS = [
  { letter: "K", bg: "bg-kids-magenta" },
  { letter: "i", bg: "bg-kids-navy" },
  { letter: "D", bg: "bg-kids-green" },
  { letter: "S", bg: "bg-kids-yellow" },
];

export function LogoMark({ size = 44, className }: Props) {
  return (
    <div
      className={`grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden shadow-sm shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {CELLS.map(({ letter, bg }) => (
        <div
          key={letter}
          className={`${bg} flex items-center justify-center text-white font-black leading-none`}
          style={{ fontSize: size * 0.32 }}
        >
          {letter}
        </div>
      ))}
    </div>
  );
}
