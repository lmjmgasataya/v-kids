"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

function GenerateButton({ hasLink }: { hasLink: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-kids-navy text-white text-sm font-semibold px-4 py-2 hover:bg-kids-navy/90 disabled:opacity-60 transition"
    >
      {pending ? "Generating…" : hasLink ? "Generate new link" : "Generate link"}
    </button>
  );
}

export function RegistrationLinkCard({
  title,
  description,
  url,
  expiresAt,
  action,
  deleteAction,
}: {
  title: string;
  description: string;
  url: string | null;
  expiresAt: string | null;
  action: (formData: FormData) => void;
  deleteAction: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const expiresAtDate = expiresAt ? new Date(expiresAt) : null;
  const isExpired = expiresAtDate ? expiresAtDate <= new Date() : false;

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {url && (
          <span
            className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
              isExpired ? "bg-red-100 text-red-600" : "bg-kids-green/15 text-kids-green"
            }`}
          >
            {isExpired ? "Expired" : "Active"}
          </span>
        )}
      </div>

      {url && (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-lg border border-kids-navy/30 text-kids-navy text-sm font-semibold px-3 py-2 hover:bg-kids-navy/5 transition"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm(`Delete this ${title.toLowerCase()} link? Anyone still holding it will lose access.`)) {
                e.preventDefault();
              }
            }}
          >
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-red-200 text-red-600 text-sm font-semibold px-3 py-2 hover:bg-red-50 transition"
            >
              Delete
            </button>
          </form>
        </div>
      )}

      {expiresAtDate && (
        <p className="text-xs text-gray-400">
          {isExpired ? "Expired" : "Expires"} {expiresAtDate.toLocaleString()}
        </p>
      )}

      <form action={action} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
          Expires at
          <input
            type="datetime-local"
            name="expiresAt"
            required
            defaultValue={expiresAtDate ? toDatetimeLocalValue(expiresAtDate) : undefined}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
          />
        </label>
        <GenerateButton hasLink={!!url} />
      </form>
    </div>
  );
}
