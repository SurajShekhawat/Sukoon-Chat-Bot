import React from "react";
import { Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { listGoals, getGoalsSummary } from "@/lib/services/goal";
import { GoalsClient } from "./goals-client";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ goals }, summary] = await Promise.all([
    listGoals(user.id),
    getGoalsSummary(user.id),
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <span>Personal Growth & Intentions</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
          Set bite-sized, gentle intentions. Celebrate small daily steps and track your personal pace.
        </p>
      </div>

      <GoalsClient initialGoals={goals} initialSummary={summary} />
    </div>
  );
}
