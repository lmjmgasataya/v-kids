"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/toast/ToastContext";

export function IdStatusCheckbox({
  id,
  checked,
  action,
  fieldLabel,
  personName,
  disabled,
}: {
  id: number;
  checked: boolean;
  action: (id: number, value: boolean) => Promise<{ error?: string }>;
  fieldLabel: string;
  personName: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(checked);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function toggle() {
    const next = !value;
    setValue(next);
    startTransition(async () => {
      const result = await action(id, next);
      if (result?.error) {
        setValue(!next);
        showToast("error", result.error);
      } else {
        showToast("success", `${next ? "Marked" : "Unmarked"} ${fieldLabel.toLowerCase()} for ${personName}.`);
      }
    });
  }

  return (
    <input
      type="checkbox"
      checked={value}
      onChange={toggle}
      disabled={disabled || isPending}
      aria-label={`${fieldLabel} for ${personName}`}
      className="h-4 w-4 accent-kids-navy disabled:opacity-50"
    />
  );
}
