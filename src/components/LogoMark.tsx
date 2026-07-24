import Image from "next/image";

const ASPECT_RATIO = 492 / 404;

interface Props {
  size?: number;
  className?: string;
  priority?: boolean;
}

export function LogoMark({ size = 44, className, priority }: Props) {
  return (
    <Image
      src="/kids-logo.webp"
      alt="Kids Church logo"
      width={size}
      height={Math.round(size * ASPECT_RATIO)}
      className={className}
      priority={priority}
    />
  );
}
