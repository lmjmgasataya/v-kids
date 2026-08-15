export function ExpiredLinkNotice() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center max-w-md mx-auto">
      <span className="text-4xl">⏰</span>
      <h2 className="text-2xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
        This link has expired
      </h2>
      <p className="text-sm text-gray-500">
        This registration link is no longer valid. Please ask church staff for a new link.
      </p>
    </div>
  );
}
