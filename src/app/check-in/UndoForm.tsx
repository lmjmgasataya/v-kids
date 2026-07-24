"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { useToastOnResult } from "@/components/toast/useToastOnResult";

export function UndoForm({
  action,
  confirmText,
  label,
  pendingLabel,
  className,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: string }>;
  confirmText: string;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(
    (_prev: { error?: string; success?: string } | undefined, formData: FormData) => action(formData),
    undefined
  );
  useToastOnResult(state);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <SubmitButton label={label} pendingLabel={pendingLabel} className={className} />
    </form>
  );
}
