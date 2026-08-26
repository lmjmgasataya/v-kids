"use client";

import { useState } from "react";
import { deleteGrant, updateGrant, type GrantEntry } from "./actions";
import { useToast } from "@/components/toast/ToastContext";
import { inputCls } from "@/components/form";

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function GrantEditRow({ grant, onChanged }: { grant: GrantEntry; onChanged: () => void }) {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState(String(grant.amount));

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

  function startEdit() {
    setAmount(String(grant.amount));
    setIsEditing(true);
  }

  async function handleSave() {
    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      showToast("error", "Enter a whole number amount greater than 0.");
      return;
    }
    setIsSaving(true);
    const result = await updateGrant(grant.id, parsed);
    setIsSaving(false);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    showToast("success", "Grant updated.");
    setIsEditing(false);
    onChanged();
  }

  if (isEditing) {
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <div>
          <div className="text-gray-900">{grant.reason}</div>
          <div className="text-xs text-gray-400">{dateTimeFormatter.format(grant.createdAt)}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isSaving}
            autoFocus
            className={`${inputCls} w-20 px-2 py-1`}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-semibold text-kids-green hover:text-kids-green/80 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            disabled={isSaving}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </li>
    );
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
          onClick={startEdit}
          className="text-xs font-semibold text-kids-navy hover:text-kids-navy/70"
        >
          Edit
        </button>
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
