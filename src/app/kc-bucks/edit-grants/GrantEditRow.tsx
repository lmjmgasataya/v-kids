"use client";

import { useState } from "react";
import { updateGrant, deleteGrant, type GrantEntry } from "./actions";
import { KC_BUCKS_REASON_OPTIONS } from "@/lib/constants";
import { inputCls } from "@/components/form";
import { useToast } from "@/components/toast/ToastContext";

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

export function GrantEditRow({ grant, onChanged }: { grant: GrantEntry; onChanged: () => void }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const presetReason = KC_BUCKS_REASON_OPTIONS.includes(grant.reason) ? grant.reason : "Other";
  const [amount, setAmount] = useState(String(grant.amount));
  const [reason, setReason] = useState(presetReason);
  const [customReason, setCustomReason] = useState(presetReason === "Other" ? grant.reason : "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    const finalReason = reason === "Other" ? customReason.trim() : reason;
    const result = await updateGrant(grant.id, Number(amount), finalReason);
    setIsSaving(false);
    if (result.error) {
      setError(result.error);
      showToast("error", result.error);
      return;
    }
    setEditing(false);
    showToast("success", "Grant updated.");
    onChanged();
  }

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

  if (!editing) {
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
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-kids-navy hover:underline"
          >
            Edit
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3 text-sm bg-gray-50">
      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputCls} w-24`}
        />
        <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
          {KC_BUCKS_REASON_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {reason === "Other" && (
        <input
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Describe the reason"
          className={inputCls}
        />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="text-xs font-bold text-white bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-semibold text-gray-400 hover:text-kids-navy"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 ml-auto"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
