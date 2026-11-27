"use client";

import React, { useState } from "react";
import { MoodEntry } from "@/types/mood";
import { WeeklyReflection } from "@/lib/services/mood";
import {
  Smile,
  Calendar,
  Trash2,
  AlertCircle,
  TrendingUp,
  HeartHandshake,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  initialEntries: MoodEntry[];
  initialReflection: WeeklyReflection;
}

const MOOD_LEVELS = [
  { score: 1, label: "Struggling", emoji: "🌧️", desc: "Overwhelmed / Exhausted" },
  { score: 2, label: "Low", emoji: "⛅", desc: "Drained or Heavy" },
  { score: 3, label: "Okay", emoji: "🌤️", desc: "Steady & Balanced" },
  { score: 4, label: "Good", emoji: "☀️", desc: "Positive & Clear" },
  { score: 5, label: "Peaceful", emoji: "✨", desc: "Grounded & Content" },
];

const EMOTION_CHIPS = [
  "Calm",
  "Grateful",
  "Anxious",
  "Exhausted",
  "Hopeful",
  "Lonely",
  "Overwhelmed",
  "Peaceful",
  "Sad",
  "Motivated",
];

export function MoodClient({ initialEntries, initialReflection }: Props) {
  const [entries, setEntries] = useState<MoodEntry[]>(initialEntries);
  const [reflection, setReflection] = useState<WeeklyReflection>(initialReflection);

  // Form state
  const [selectedScore, setSelectedScore] = useState<number>(3);
  const [selectedEmotion, setSelectedEmotion] = useState<string>("Calm");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRecordCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: selectedScore,
          primaryEmotion: selectedEmotion,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record check-in");

      setEntries([data.entry, ...entries]);
      setNotes("");
      showToast("Mood check-in recorded mindfully.");

      // Refresh weekly reflection
      const refRes = await fetch("/api/mood");
      if (refRes.ok) {
        const refData = await refRes.json();
        if (refData.reflection) setReflection(refData.reflection);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this check-in?")) return;

    try {
      const res = await fetch(`/api/mood/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry");

      setEntries(entries.filter((e) => e.id !== id));
      showToast("Check-in removed from journal.");
    } catch {
      showToast("Could not delete check-in.");
    }
  };

  // Format local browser timezone timestamp
  const formatDateTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-8">
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

      {/* Check-In Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-500" />
            <span>How are you feeling in this moment?</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pause and check in with yourself. No judgment, just honest awareness.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRecordCheckIn} className="space-y-6">
          {/* Mood Scale (1 to 5) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              1. Emotional Energy
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {MOOD_LEVELS.map((lvl) => (
                <button
                  key={lvl.score}
                  type="button"
                  onClick={() => setSelectedScore(lvl.score)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedScore === lvl.score
                      ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 text-slate-900 dark:text-slate-100 ring-2 ring-amber-400/40"
                      : "border-warm-200 dark:border-slate-800 bg-warm-50/30 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 hover:border-warm-300"
                  }`}
                >
                  <span className="text-2xl">{lvl.emoji}</span>
                  <span className="text-xs font-bold mt-1">{lvl.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{lvl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Emotion Chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              2. Dominant Feeling
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTION_CHIPS.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedEmotion === emotion
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-warm-200 dark:border-slate-800 hover:border-warm-300"
                  }`}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Private Journal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              3. Private Reflection (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What is sitting on your mind right now? Any specific trigger, conversation, or gratitude?"
              rows={3}
              maxLength={1000}
              className="w-full rounded-2xl border border-warm-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500"
            />
            <div className="text-right text-[11px] text-slate-400 mt-1">
              {notes.length} / 1000
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Save Daily Check-In"}
            </Button>
          </div>
        </form>
      </div>

      {/* 7-Day Mindful Trajectory & Weekly Reflection Card */}
      <div className="p-6 rounded-3xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <span>7-Day Mindful Reflection</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated from your private check-ins over the past week.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Weekly Average</span>
              <span className="text-lg font-extrabold text-teal-700 dark:text-teal-400">
                {reflection.totalCheckIns > 0 ? `${reflection.averageScore} / 5` : "N/A"}
              </span>
            </div>
            <div className="text-right border-l border-teal-200 dark:border-teal-800 pl-3">
              <span className="text-xs text-slate-400 block">Check-Ins</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {reflection.totalCheckIns}
              </span>
            </div>
          </div>
        </div>

        {/* Reflection summary text */}
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/70 p-4 rounded-2xl border border-teal-100 dark:border-teal-900/40">
          {reflection.reflectionSummary}
        </p>

        {/* Emotion breakdown pills */}
        {reflection.dominantEmotions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Frequent states:</span>
            {reflection.dominantEmotions.map((de) => (
              <span
                key={de.emotion}
                className="px-2.5 py-0.5 rounded-full bg-teal-100/80 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-medium text-[11px]"
              >
                {de.emotion} ({de.count})
              </span>
            ))}
          </div>
        )}

        {/* Strict Non-Clinical Disclaimer */}
        <div className="pt-2 border-t border-teal-200/60 dark:border-teal-900/40 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>{reflection.disclaimer}</span>
        </div>
      </div>

      {/* Mood Check-In History */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Journal History ({entries.length})</span>
        </h3>

        {entries.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 space-y-2">
            <p className="text-sm text-slate-500">
              No mood check-ins recorded yet. Select how you feel above to log your first reflection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {entries.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs flex items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">
                      {MOOD_LEVELS.find((m) => m.score === item.score)?.emoji || "🌤️"}
                    </span>
                    <Badge variant="calm">
                      Score: {item.score}/5 • {item.primaryEmotion}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(item.recordedAt)}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap pl-1">
                      {item.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  title="Delete check-in"
                  onClick={() => handleDeleteEntry(item.id)}
                  className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

