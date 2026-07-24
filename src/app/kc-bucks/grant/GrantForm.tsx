"use client";

import { useActionState, useEffect, useState } from "react";
import { grantCredits } from "./actions";
import { KC_BUCKS_REASON_OPTIONS } from "@/lib/constants";
import { Field, inputCls } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import type { KcBucksKid } from "../actions";

const PRESET_AMOUNTS = [5, 10, 20, 50];

export function GrantForm({
  kid,
  onDone,
  onGranted,
}: {
  kid: KcBucksKid;
  onDone: () => void;
  onGranted: () => void;
}) {
  const grantWithId = grantCredits.bind(null, kid.id);
  const [state, action] = useActionState(grantWithId, undefined);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  useToastOnResult(state);

  useEffect(() => {
    if (state?.success) onGranted();
  }, [state, onGranted]);

  return (
    <div className="rounded-2xl border-2 border-kids-green/30 bg-kids-green/5 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-lg text-kids-navy">
            {kid.firstName} {kid.lastName}
          </div>
          <div className="text-xs text-gray-500">Age {kid.age}</div>
        </div>
        <button type="button" onClick={onDone} className="text-sm text-gray-400 hover:text-kids-navy">
          Change kid
        </button>
      </div>

      <form action={action} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credits to grant <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setIsCustomAmount(false);
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition ${
                  !isCustomAmount && amount === preset
                    ? "border-kids-green bg-kids-green/10 text-kids-green"
                    : "border-gray-200 text-gray-500 hover:border-kids-green/40"
                }`}
              >
                <span className="text-2xl">🪙</span>
                <span className="text-sm font-bold">{preset} Bucks</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsCustomAmount(true);
                setAmount(null);
              }}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 transition ${
                isCustomAmount
                  ? "border-kids-green bg-kids-green/10 text-kids-green"
                  : "border-gray-200 text-gray-500 hover:border-kids-green/40"
              }`}
            >
              <span className="text-2xl">✏️</span>
              <span className="text-sm font-bold">Other</span>
            </button>
          </div>
          {isCustomAmount && (
            <input
              type="number"
              min={1}
              step={1}
              autoFocus
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className={`${inputCls} mt-2`}
            />
          )}
          <input type="hidden" name="amount" value={isCustomAmount ? customAmount : amount ?? ""} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            name="reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputCls}
          >
            <option value="" disabled>
              Select…
            </option>
            {KC_BUCKS_REASON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {reason === "Other" && (
          <Field label="Describe the reason" name="customReason" required placeholder="e.g. Helped clean up" />
        )}

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <SubmitButton
          label="Grant credits"
          pendingLabel="Granting…"
          className="bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition"
        />
      </form>
    </div>
  );
}
