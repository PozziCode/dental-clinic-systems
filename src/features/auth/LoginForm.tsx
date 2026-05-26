"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/lib/validators/clinic";
import { loginAction } from "@/features/auth/actions";

type LoginInput = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function submit(values: LoginInput) {
    const formData = new FormData();
    formData.set("email", values.email);
    formData.set("password", values.password);
    setMessage("");
    startTransition(async () => {
      const result = await loginAction({}, formData);
      if (result?.error) {
        setMessage(result.error);
      }
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Email Address
        </label>
        <input
          type="email"
          placeholder="your@dental.com"
          autoComplete="email"
          disabled={isPending}
          {...form.register("email")}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-600"
        />
        {form.formState.errors.email ? (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <Link href="/forgot-password" className="text-sm text-sky-600 hover:underline">
            Forgot Password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isPending}
            {...form.register("password")}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 outline-none transition focus:border-sky-600"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isPending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {form.formState.errors.password ? (
          <p className="mt-2 text-sm text-red-600">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-sky-600 px-4 py-3 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
