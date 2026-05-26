import { ActionForm } from "@/components/shared/ActionForm";
import { updatePasswordAction } from "@/features/auth/actions";

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Change password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter a new password for your account.
        </p>
        <ActionForm
          action={updatePasswordAction}
          submitLabel="Update password"
          pendingLabel="Updating..."
          className="mt-6 space-y-4"
        >
          <input
            name="password"
            type="password"
            placeholder="New password"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-sky-600"
          />
        </ActionForm>
      </div>
    </main>
  );
}
