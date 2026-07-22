import Link from "next/link";

export default function RegisterSuccessPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <span className="text-6xl">🎉</span>
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
        You&apos;re all set!
      </h2>
      <p className="text-gray-500 max-w-sm">
        Thanks for registering. See you at Kids Church!
      </p>
      <Link href="/" className="text-sm font-semibold text-kids-magenta hover:underline">
        Back to home
      </Link>
    </div>
  );
}
