"use client";

import { useState } from "react";
import { deleteGrant, type GrantEntry } from "./actions";
import { useToast } from "@/components/toast/ToastContext";

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function GrantEditRow({ grant, onChanged }: { grant: GrantEntry; onChanged: () => void }) {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete this ${grant.amount}-credit grant for "${grant.reason}"?`)) return;
    setIsDeleting(true);
    const result = await deleteGrant(grant.id);
    setIsDeleting(false);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    showToast("success", "Grant deleted.");
    onChanged();
  }

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <div>
        <div className="text-gray-900">{grant.reason}</div>
        <div className="text-xs text-gray-400">{dateTimeFormatter.format(grant.createdAt)}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-kids-green">+{grant.amount}</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
