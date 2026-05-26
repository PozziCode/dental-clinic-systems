"use client";

import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  children,
  pendingText = "Saving...",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "rounded-xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
      }
    >
      {pending ? pendingText : children}
    </button>
  );
}
