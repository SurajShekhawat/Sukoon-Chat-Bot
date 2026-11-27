"use client";

import React, { useActionState } from "react";
import { updateSettingsAction } from "./settings-actions";
import { ProfileRow } from "@/lib/services/profile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Brain, Sparkles, Check } from "lucide-react";

interface SettingsFormProps {
  initialProfile: ProfileRow;
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
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
          className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>{state.success}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="displayName"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
        >
          Preferred Name
        </label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialProfile.display_name}
          required
          disabled={isPending}
        />
        <p className="text-xs text-slate-500">Your companion will use this name in conversations.</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="preferredLanguage"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
        >
          Communication Language
        </label>
        <select
          id="preferredLanguage"
          name="preferredLanguage"
          defaultValue={initialProfile.preferred_language}
          disabled={isPending}
          className="flex h-10 w-full rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500 transition-colors"
        >
          <option value="hinglish">Hinglish (Conversational Hindi & English blend)</option>
          <option value="hi">Hindi (हिन्दी - देवनागरी)</option>
          <option value="en">English (Warm reflective English)</option>
        </select>
        <p className="text-xs text-slate-500">
          The companion dynamically adapts to your preferred linguistic style.
        </p>
      </div>

      {/* Consent-Based Memory Vault Toggle */}
      <div className="p-4 rounded-2xl bg-warm-50 dark:bg-slate-800/60 border border-warm-200 dark:border-slate-700 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <label htmlFor="memoryConsent" className="font-semibold text-sm cursor-pointer">
                Consent-Driven Memory Vault
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Allow Sukoon AI to retain important context (e.g. goals, loved ones, preferences).
                You can review, edit, or delete memories at any time from your Memory Vault.
              </p>
            </div>
          </div>

          <input
            id="memoryConsent"
            name="memoryConsent"
            type="checkbox"
            defaultChecked={initialProfile.memory_consent}
            disabled={isPending}
            className="w-5 h-5 mt-1 rounded text-sukoon-600 focus:ring-sukoon-500 border-warm-300 cursor-pointer"
          />
        </div>
      </div>

      {/* Theme Selection */}
      <div className="space-y-1.5">
        <label
          htmlFor="theme"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
        >
          Theme
        </label>
        <select
          id="theme"
          name="theme"
          defaultValue={initialProfile.theme}
          disabled={isPending}
          className="flex h-10 w-full rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500 transition-colors"
        >
          <option value="warm-light">Warm Light (Calming cream & teal)</option>
          <option value="warm-dark">Warm Dark (Deep slate & warm tones)</option>
          <option value="system">System Preference</option>
        </select>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-sukoon-600" />
          <span>Stored securely in PostgreSQL with Row Level Security</span>
        </div>

        <Button type="submit" isLoading={isPending} className="gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>
    </form>
  );
}

