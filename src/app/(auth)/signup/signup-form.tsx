"use client";

import React, { useActionState } from "react";
import { signUpAction } from "../auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300"
        >
          {state.error}
        </div>
      )}

      {state?.success && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs text-teal-800 dark:text-teal-300"
        >
          {state.success}
        </div>
      )}

      <div>
        <label
          htmlFor="displayName"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
        >
          Preferred Name or Nickname
        </label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="e.g. Priya or Rahul"
          defaultValue="Friend"
          disabled={isPending}
        />
        <p className="text-[11px] text-slate-500 mt-1">This is how your companion will address you.</p>
      </div>

      <div>
        <label
          htmlFor="preferredLanguage"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
        >
          Preferred Conversation Language
        </label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue="hinglish"
          disabled={isPending}
          className="flex h-10 w-full rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500 transition-colors"
        >
          <option value="hinglish">Hinglish (Natural conversational blend)</option>
          <option value="hi">Hindi (हिन्दी - देवनागरी)</option>
          <option value="en">English (Calm international English)</option>
        </select>
      </div>

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
        <label
          htmlFor="password"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 chars, 1 uppercase, 1 number"
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full mt-2" isLoading={isPending}>
        <span>Create My Free Account</span>
      </Button>
    </form>
  );
}

