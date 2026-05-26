"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/components/shared/FormSubmitButton";

type ActionState = {
  error?: string;
  success?: string;
};

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving...",
  className = "space-y-4",
}: {
  action: (
    state: ActionState | void,
    formData: FormData
  ) => Promise<ActionState | void>;
  children: React.ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
      <FormSubmitButton pendingText={pendingLabel}>{submitLabel}</FormSubmitButton>
    </form>
  );
}
