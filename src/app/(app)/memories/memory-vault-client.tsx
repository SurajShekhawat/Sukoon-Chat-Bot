"use client";

import React, { useState } from "react";
import { UserMemory } from "@/types/memory";
import { MemoryCategory } from "@/types/database";
import {
  Brain,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  EyeOff,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialMemories: UserMemory[];
  initialConsent: boolean;
}

const CATEGORIES: Array<{ key: MemoryCategory | "all"; label: string }> = [
  { key: "all", label: "All Context" },
  { key: "personal", label: "Personal" },
  { key: "career", label: "Career & Work" },
  { key: "relationship", label: "Relationships" },
  { key: "goal", label: "Goals" },
  { key: "preference", label: "Preferences" },
  { key: "general", label: "General" },
];

export function MemoryVaultClient({ initialMemories, initialConsent }: Props) {
  const [memories, setMemories] = useState<UserMemory[]>(initialMemories);
  const [consentEnabled, setConsentEnabled] = useState<boolean>(initialConsent);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("personal");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editingMemory, setEditingMemory] = useState<UserMemory | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<MemoryCategory>("personal");

  // Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Toggle Global Consent
  const handleToggleConsent = async () => {
    const nextState = !consentEnabled;
    try {
      const res = await fetch("/api/memories/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: nextState }),
      });

      if (!res.ok) throw new Error("Failed to update memory consent");

      setConsentEnabled(nextState);
      showToast(
        nextState
          ? "Memory Vault is now active. Consented context will be available to Sukoon."
          : "Memory Vault paused. Sukoon will not load or access any long-term context."
      );
    } catch {
      showToast("Error updating memory consent status.");
    }
  };

  // Add Memory
  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create memory");
      }

      setMemories([data.memory, ...memories]);
      setNewContent("");
      setShowAddForm(false);
      showToast("Memory saved with explicit consent.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active/Revoke single item
  const handleToggleActive = async (memory: UserMemory) => {
    try {
      const res = await fetch(`/api/memories/${memory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !memory.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update memory state");
      const data = await res.json();

      setMemories(memories.map((m) => (m.id === memory.id ? data.memory : m)));
      showToast(
        data.memory.isActive
          ? "Memory resumed for conversations."
          : "Memory revoked. It will not be loaded into chat context."
      );
    } catch {
      showToast("Failed to toggle memory status.");
    }
  };

  // Edit Memory
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory || !editContent.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/memories/${editingMemory.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent.trim(),
          category: editCategory,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update memory");

      setMemories(memories.map((m) => (m.id === editingMemory.id ? data.memory : m)));
      setEditingMemory(null);
      showToast("Memory updated successfully.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to update memory.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Memory
  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this memory? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/memories/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete memory");

      setMemories(memories.filter((m) => m.id !== id));
      showToast("Memory permanently deleted from the database.");
    } catch {
      showToast("Failed to delete memory.");
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (selectedCategory === "all") return true;
    return m.category === selectedCategory;
  });

  const activeCount = memories.filter((m) => m.isActive).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-xl text-sm flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Master Consent Control Banner */}
      <div
        className={`p-6 rounded-3xl border transition-colors ${
          consentEnabled
            ? "bg-teal-50/70 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60"
            : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60"
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                Memory Vault Status: {consentEnabled ? "Active & Consented" : "Paused"}
              </span>
              <Badge variant={consentEnabled ? "calm" : "secondary"}>
                {consentEnabled ? "Consent Granted" : "Zero Memory Access"}
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
              {consentEnabled
                ? "Sukoon uses only active, consented memories below to provide personalized empathy. You can inspect, modify, or erase any memory anytime."
                : "When paused, Sukoon treats every conversation as completely fresh. Zero past memories are loaded into AI prompts."}
            </p>
          </div>

          <Button
            variant={consentEnabled ? "outline" : "primary"}
            size="sm"
            onClick={handleToggleConsent}
            className="shrink-0"
          >
            {consentEnabled ? (
              <>
                <EyeOff className="w-4 h-4 mr-1.5" />
                <span>Pause Vault</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1.5" />
                <span>Resume Vault</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header Actions & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{memories.length} saved memories</span>
          <span>•</span>
          <span className="text-teal-600 dark:text-teal-400 font-medium">
            {activeCount} active in context
          </span>
          {memories.length - activeCount > 0 && (
            <>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400">
                {memories.length - activeCount} revoked
              </span>
            </>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowAddForm(!showAddForm);
            setFormError(null);
          }}
          disabled={!consentEnabled}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Memory</span>
        </Button>
      </div>

      {/* Add Memory Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMemory}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Explicitly Add Context for Sukoon</span>
            </h3>
            <span className="text-xs text-slate-400">Consent-Driven</span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
              className="flex h-10 w-full rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            >
              <option value="personal">Personal (Life context, family, preferences)</option>
              <option value="career">Career & Work (Job, exams, professional goals)</option>
              <option value="relationship">Relationships (Friends, partner, family dynamics)</option>
              <option value="goal">Personal Goals & Aspirations</option>
              <option value="preference">Communication Preferences</option>
              <option value="general">General Reflection</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              What should Sukoon remember?
            </label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Preparing for civil services exam in 6 months, elder brother is named Rohan."
              rows={3}
              required
              maxLength={500}
              className="w-full rounded-2xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>Never store passwords, banking details, or government IDs.</span>
              <span>{newContent.length} / 500</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Memory"}
            </Button>
          </div>
        </form>
      )}

      {/* Edit Memory Modal / Box */}
      {editingMemory && (
        <form
          onSubmit={handleSaveEdit}
          className="p-5 rounded-3xl bg-warm-50 dark:bg-slate-900 border-2 border-teal-500/40 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-teal-600" />
              <span>Edit Memory</span>
            </h3>
            <span className="text-xs text-slate-400">ID: {editingMemory.id.slice(0, 8)}...</span>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as MemoryCategory)}
              className="flex h-10 w-full rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            >
              <option value="personal">Personal</option>
              <option value="career">Career & Work</option>
              <option value="relationship">Relationships</option>
              <option value="goal">Goals</option>
              <option value="preference">Preferences</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Content
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              required
              maxLength={500}
              className="w-full rounded-2xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingMemory(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Memory"}
            </Button>
          </div>
        </form>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.key
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-warm-200 dark:border-slate-800 hover:border-warm-300"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Memories List */}
      {filteredMemories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-warm-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No memories in this view
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Sukoon only remembers things you explicitly consent to. You can click &ldquo;Add New Memory&rdquo; above to record key context.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredMemories.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-2xl border transition-all bg-white dark:bg-slate-900 ${
                m.isActive
                  ? "border-warm-200 dark:border-slate-800 shadow-xs"
                  : "border-dashed border-slate-300 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-950/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {m.category}
                    </Badge>
                    <Badge
                      variant={m.isActive ? "calm" : "secondary"}
                      className="text-[10px]"
                    >
                      {m.isActive ? "Active in AI Context" : "Revoked (Paused)"}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {m.content}
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Saved on {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Revoke / Resume Toggle */}
                  <button
                    type="button"
                    title={m.isActive ? "Revoke (Exclude from AI prompts)" : "Resume (Include in AI prompts)"}
                    onClick={() => handleToggleActive(m)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {m.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-teal-600" />}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    title="Edit memory"
                    onClick={() => {
                      setEditingMemory(m);
                      setEditContent(m.content);
                      setEditCategory(m.category);
                      setFormError(null);
                    }}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    title="Delete permanently"
                    onClick={() => handleDeleteMemory(m.id)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security & Data Retention Notice */}
      <div className="p-4 rounded-2xl bg-warm-100/60 dark:bg-slate-900/60 border border-warm-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          <span>Data Retention & Security Guarantee</span>
        </div>
        <p>
          Memories are stored in a dedicated PostgreSQL table secured with Row Level Security (RLS) so only you can read or edit them. Deleted memories are immediately purged from database rows. All memories are treated strictly as untrusted background context, never as system instructions.
        </p>
      </div>
    </div>
  );
}
