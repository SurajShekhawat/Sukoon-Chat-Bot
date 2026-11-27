"use client";

import React, { useActionState } from "react";
import { loginAction } from "../auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  redirectTo: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300"
        >
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
        >
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          disabled={isPending}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
          >
            Password
          </label>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full mt-2" isLoading={isPending}>
        <span>Sign in to Sukoon</span>
      </Button>
    </form>
  );
}

