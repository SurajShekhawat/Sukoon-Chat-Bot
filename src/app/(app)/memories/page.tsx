import React from "react";
import { Brain, ShieldCheck } from "lucide-react";
import { getCurrentProfile } from "@/lib/services/profile";
import { listUserMemories } from "@/lib/services/memory";
import { MemoryVaultClient } from "./memory-vault-client";

export const dynamic = "force-dynamic";

export default async function MemoriesPage() {
  const profile = await getCurrentProfile();
  const userId = profile?.id || "";

  const { memories } = userId
    ? await listUserMemories(userId)
    : { memories: [] };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <span>Consent-Driven Memory Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            Sukoon only remembers what you consent to. You can inspect, edit, pause, or permanently purge any detail anytime.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-3.5 py-1.5 rounded-full border border-teal-200 dark:border-teal-800 shrink-0">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>RLS Protected • Zero Shadow Retention</span>
        </div>
      </div>

      {/* Main Interactive Client */}
      <MemoryVaultClient
        initialMemories={memories}
        initialConsent={profile?.memory_consent ?? true}
      />
    </div>
  );
}
