import React from "react";
import { getCurrentProfile } from "@/lib/services/profile";
import { SettingsForm } from "./settings-form";
import { PrivacyControls } from "./privacy-controls";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile & Privacy Settings</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Control how Sukoon AI communicates with you, manages your memory vault, and protects your data.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-warm-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        {profile ? (
          <SettingsForm initialProfile={profile} />
        ) : (
          <p className="text-sm text-slate-500">Loading profile data...</p>
        )}
      </div>

      {/* Privacy Governance, Data Portability & Right to be Forgotten */}
      <PrivacyControls />

      {/* Admin AI Infrastructure Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-warm-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            AI Infrastructure & Multi-Model Settings
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Configure Google Gemini, OpenAI, and NVIDIA NIM hosted model catalogs, task routing policies, and licensing tiers.
          </p>
        </div>
        <a
          href="/admin/ai-settings"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-sukoon-600 hover:bg-sukoon-700 text-white transition shadow-sm"
        >
          Manage AI Models &rarr;
        </a>
      </div>
    </div>
  );
}

