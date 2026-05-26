import { ActionForm } from "@/components/shared/ActionForm";
import { forgotPasswordAction } from "@/features/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email. We will send a reset link.
        </p>
        <ActionForm
          action={forgotPasswordAction}
          submitLabel="Send reset link"
          pendingLabel="Sending..."
          className="mt-6 space-y-4"
        >
          <input
            name="email"
            type="email"
            placeholder="Email address"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-sky-600"
          />
        </ActionForm>
      </div>
    </main>
  );
}
