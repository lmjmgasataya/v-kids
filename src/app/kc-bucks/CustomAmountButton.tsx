"use client";

import { useActionState, useEffect, useState } from "react";
import { Field } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { useToast } from "@/components/toast/ToastContext";
import type { KcBucksKid } from "./actions";
import { capitalizeName } from "@/lib/format";

interface AmountResult {
  error?: string;
  success?: string;
}

type AmountAction<T extends AmountResult> = (prev: T | undefined, formData: FormData) => Promise<T>;

// Full class strings so Tailwind can see them.
const TONES = {
  green: {
    trigger: "text-kids-green border-kids-green hover:bg-kids-green/10",
    submit: "bg-kids-green hover:bg-kids-green/90",
  },
  magenta: {
    trigger: "text-kids-magenta border-kids-magenta hover:bg-kids-magenta/10",
    submit: "bg-kids-magenta hover:bg-kids-magenta/90",
  },
};

/** A button that opens a popup asking for a custom KC Bucks amount, then posts it as `amount` to `action`. */
export function CustomAmountButton<T extends AmountResult>({
  kid,
  action,
  title,
  confirmMessage,
  submitLabel,
  pendingLabel,
  tone,
  label = "Custom",
  className,
  max,
  onSuccess,
}: {
  kid: KcBucksKid;
  action: AmountAction<T>;
  title: string;
  /** Text for the confirm() shown before submitting, given the entered amount and the kid's name. */
  confirmMessage: (amount: number, kidName: string) => string;
  submitLabel: string;
  pendingLabel: string;
  tone: keyof typeof TONES;
  label?: string;
  className?: string;
  max?: number;
  onSuccess?: (result: T) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          `whitespace-nowrap text-xs font-bold border px-3 py-1.5 rounded-lg transition ${TONES[tone].trigger}`
        }
      >
        {label}
      </button>

      {open && (
        <CustomAmountModal
          kid={kid}
          action={action}
          title={title}
          confirmMessage={confirmMessage}
          submitLabel={submitLabel}
          pendingLabel={pendingLabel}
          tone={tone}
          max={max}
          onClose={() => setOpen(false)}
          onSuccess={(result) => {
            setOpen(false);
            onSuccess?.(result);
          }}
        />
      )}
    </>
  );
}

function CustomAmountModal<T extends AmountResult>({
  kid,
  action,
  title,
  confirmMessage,
  submitLabel,
  pendingLabel,
  tone,
  max,
  onClose,
  onSuccess,
}: {
  kid: KcBucksKid;
  action: AmountAction<T>;
  title: string;
  /** Text for the confirm() shown before submitting, given the entered amount and the kid's name. */
  confirmMessage: (amount: number, kidName: string) => string;
  submitLabel: string;
  pendingLabel: string;
  tone: keyof typeof TONES;
  max?: number;
  onClose: () => void;
  onSuccess: (result: T) => void;
}) {
  const { showToast } = useToast();
  const kidName = `${capitalizeName(kid.firstName)} ${capitalizeName(kid.lastName)}`;
  // Toasts fire here rather than via useToastOnResult, since a success unmounts this modal
  // before an effect on the new state would run.
  const [state, formAction] = useActionState(async (prev: T | undefined, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.error) showToast("error", result.error);
    else if (result.success) {
      showToast("success", result.success);
      onSuccess(result);
    }
    return result;
  }, undefined);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 text-left whitespace-normal"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-amount-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="custom-amount-title"
          className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]"
        >
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{kidName}</p>

        <form
          action={formAction}
          onSubmit={(e) => {
            const amount = Number(new FormData(e.currentTarget).get("amount"));
            if (!confirm(confirmMessage(amount, kidName))) e.preventDefault();
          }}
          className="mt-4 flex flex-col gap-3"
        >
          <Field
            label="Amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={max}
            step={1}
            required
            autoFocus
          />
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <SubmitButton
              label={submitLabel}
              pendingLabel={pendingLabel}
              className={`rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:opacity-50 ${TONES[tone].submit}`}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
