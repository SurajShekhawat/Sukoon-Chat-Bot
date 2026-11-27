import React from "react";
import { Smile } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { listMoodEntries, getWeeklyMoodReflection } from "@/lib/services/mood";
import { MoodClient } from "./mood-client";

export const dynamic = "force-dynamic";

export default async function MoodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ entries }, { reflection }] = await Promise.all([
    listMoodEntries(user.id, { page: 1, limit: 30 }),
    getWeeklyMoodReflection(user.id),
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
            <Smile className="w-5 h-5" />
          </div>
          <span>Mood Journal & Self-Awareness</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Track your emotional energy, record quiet reflections, and observe weekly patterns over time.
        </p>
      </div>

      <MoodClient initialEntries={entries} initialReflection={reflection} />
    </div>
  );
}
