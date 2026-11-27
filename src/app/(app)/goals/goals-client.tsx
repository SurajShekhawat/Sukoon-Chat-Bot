"use client";

import React, { useState } from "react";
import { UserGoal } from "@/types/mood";
import { GoalsSummary } from "@/lib/services/goal";
import { GoalStatus } from "@/types/database";
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  PauseCircle,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialGoals: UserGoal[];
  initialSummary: GoalsSummary;
}

export function GoalsClient({ initialGoals, initialSummary }: Props) {
  const [goals, setGoals] = useState<UserGoal[]>(initialGoals);
  const [summary, setSummary] = useState<GoalsSummary>(initialSummary);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const refreshSummary = (updatedGoals: UserGoal[]) => {
    setSummary({
      total: updatedGoals.length,
      inProgress: updatedGoals.filter((g) => g.status === "in_progress").length,
      completed: updatedGoals.filter((g) => g.status === "completed").length,
      paused: updatedGoals.filter((g) => g.status === "paused").length,
    });
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create goal");

      const nextGoals = [data.goal, ...goals];
      setGoals(nextGoals);
      refreshSummary(nextGoals);
      setTitle("");
      setDescription("");
      setTargetDate("");
      setShowForm(false);
      showToast("Personal growth goal added!");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error creating goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (goal: UserGoal, newStatus: GoalStatus) => {
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update goal");
      const data = await res.json();

      const nextGoals = goals.map((g) => (g.id === goal.id ? data.goal : g));
      setGoals(nextGoals);
      refreshSummary(nextGoals);
      showToast(`Goal marked as ${newStatus.replace("_", " ")}`);
    } catch {
      showToast("Could not update goal status");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");

      const nextGoals = goals.filter((g) => g.id !== id);
      setGoals(nextGoals);
      refreshSummary(nextGoals);
      showToast("Goal removed.");
    } catch {
      showToast("Failed to delete goal.");
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (statusFilter === "all") return true;
    return g.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white shadow-xl text-sm flex items-center gap-2.5 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Goals</span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {summary.total}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">In Progress</span>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">
            {summary.inProgress}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">Completed</span>
          <p className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">
            {summary.completed}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-400 font-medium">Paused</span>
          <p className="text-2xl font-extrabold text-slate-500 mt-1">{summary.paused}</p>
        </div>
      </div>

      {/* Actions Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { key: "all", label: "All" },
            { key: "in_progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "paused", label: "Paused" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-warm-200 dark:border-slate-800 hover:border-warm-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            setFormError(null);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Set New Goal</span>
        </Button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <form
          onSubmit={handleCreateGoal}
          className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-600" />
            <span>Create a Personal Growth Goal</span>
          </h3>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Goal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read 20 pages before bed every night"
              required
              maxLength={150}
              className="w-full rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description or Motivation (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this meaningful for your peace of mind or growth?"
              rows={2}
              maxLength={1000}
              className="w-full rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Completion Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Goal"}
            </Button>
          </div>
        </form>
      )}

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No goals in this view
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Setting small, gentle intentions can help bring clarity to your daily rhythm. Click &ldquo;Set New Goal&rdquo; above to start.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredGoals.map((g) => (
            <div
              key={g.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      g.status === "completed"
                        ? "bg-teal-500"
                        : g.status === "in_progress"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {g.title}
                  </h4>
                  <Badge
                    variant={g.status === "completed" ? "calm" : "secondary"}
                    className="capitalize text-[10px]"
                  >
                    {g.status.replace("_", " ")}
                  </Badge>
                </div>

                {g.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                    {g.description}
                  </p>
                )}

                {g.targetDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {g.targetDate}</span>
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {g.status !== "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(g, "completed")}
                    className="text-xs text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Complete</span>
                  </Button>
                )}

                {g.status === "in_progress" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(g, "paused")}
                    className="text-xs text-slate-600"
                  >
                    <PauseCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Pause</span>
                  </Button>
                ) : g.status === "paused" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus(g, "in_progress")}
                    className="text-xs text-amber-700"
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>Resume</span>
                  </Button>
                ) : null}

                <button
                  type="button"
                  title="Delete goal"
                  onClick={() => handleDeleteGoal(g.id)}
                  className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

