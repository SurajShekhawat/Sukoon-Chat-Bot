"use client";

import React, { useState } from "react";
import { Download, Trash2, AlertTriangle, ShieldCheck, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrivacyControls() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/user/export");
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sukoon-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Could not export data. Please try again later.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmInput !== "DELETE_MY_ACCOUNT") {
      setDeleteError("Please type DELETE_MY_ACCOUNT exactly to proceed.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch("/api/user/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to purge account");
      }

      // Hard redirect to home upon erasure
      window.location.href = "/?deleted=true";
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Account deletion failed");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pt-4">
      {/* 1. Data Portability Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Download className="w-5 h-5 text-sukoon-600 dark:text-sukoon-400" />
              <span>Data Portability & Export</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
              Download a complete, machine-readable JSON archive of all your personal data, past conversation transcripts, active memory vault entries, mood journal check-ins, and growth goals.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
            className="gap-2 shrink-0 rounded-xl"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? "Preparing Archive..." : "Export All Data (JSON)"}</span>
          </Button>
        </div>
      </div>

      {/* 2. Danger Zone — Permanent Deletion */}
      <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-700 dark:text-rose-300 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>

          <div className="space-y-1 flex-1">
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 flex items-center gap-2">
              <span>Danger Zone — Right to Be Forgotten</span>
            </h3>
            <p className="text-xs text-rose-700/80 dark:text-rose-400/80 leading-relaxed max-w-xl">
              Permanently and irreversibly expunge your account, personal profile, conversations, memories, and mood entries from Sukoon AI databases. This action cannot be undone.
            </p>

            {!showConfirmModal ? (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setShowConfirmModal(true)}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete My Account</span>
                </Button>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Are you absolutely certain? This will delete all your reflections forever.</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  To confirm, type <strong className="font-mono text-rose-700 dark:text-rose-300">DELETE_MY_ACCOUNT</strong> below:
                </p>

                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="DELETE_MY_ACCOUNT"
                  className="w-full text-sm font-mono px-3.5 py-2 rounded-xl border border-warm-300 dark:border-slate-700 bg-warm-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                {deleteError && (
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{deleteError}</p>
                )}

                <div className="flex items-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={confirmInput !== "DELETE_MY_ACCOUNT" || isDeleting}
                    className="gap-2 rounded-xl text-xs font-semibold"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>{isDeleting ? "Purging Account..." : "Confirm & Delete Everything"}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmInput("");
                      setDeleteError(null);
                    }}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
