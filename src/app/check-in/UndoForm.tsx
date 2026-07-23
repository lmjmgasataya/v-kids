"use client";

import { SubmitButton } from "@/components/SubmitButton";

export function UndoForm({
  action,
  confirmText,
  label,
  pendingLabel,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmText: string;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <SubmitButton label={label} pendingLabel={pendingLabel} className={className} />
    </form>
  );
}
