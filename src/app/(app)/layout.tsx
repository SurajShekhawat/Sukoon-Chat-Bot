import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessageSquareHeart,
  Brain,
  Smile,
  Target,
  Settings,
  LogOut,
} from "lucide-react";
import { SukoonLogo } from "@/components/ui/logo";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/profile";
import { signOutAction } from "@/app/(auth)/auth-actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  const navItems = [
    { label: "Chat", href: "/chat", icon: MessageSquareHeart },
    { label: "Memory Vault", href: "/memories", icon: Brain },
    { label: "Mood Journal", href: "/mood", icon: Smile },
    { label: "Growth Goals", href: "/goals", icon: Target },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-warm-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-warm-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <SukoonLogo href="/chat" size="sm" showTagline={false} />

        <form action={signOutAction}>
          <button
            type="submit"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-warm-100 dark:hover:bg-slate-800"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </header>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col justify-between w-64 p-5 border-r border-warm-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="space-y-6">
          <div className="px-1 py-1">
            <SukoonLogo href="/chat" size="md" showTagline={true} />
          </div>

          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-slate-800 hover:text-sukoon-700 dark:hover:text-sukoon-400 transition-colors"
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-500 dark:text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Sign Out */}
        <div className="pt-4 border-t border-warm-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="truncate">
              <p className="text-sm font-semibold truncate">
                {profile?.display_name || "Friend"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex items-center justify-around border-t border-warm-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-sukoon-600"
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

