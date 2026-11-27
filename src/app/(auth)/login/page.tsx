import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SukoonLogo } from "@/components/ui/logo";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string;
    error?: string;
    message?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = params.redirectTo || "/chat";
  const errorMessage = params.error === "auth-code-error"
    ? "Could not authenticate with that link. Please try logging in again."
    : undefined;

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-warm-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 flex flex-col items-center">
        <div className="mb-6">
          <SukoonLogo href="/" size="lg" showTagline={false} />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Your calm, reflective space is waiting for you.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-3xl border border-warm-200 dark:border-slate-800 shadow-sm">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          <LoginForm redirectTo={redirectTo} />

          <div className="mt-6 pt-6 border-t border-warm-200 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              New to Sukoon?{" "}
              <Link
                href="/signup"
                className="font-medium text-sukoon-700 dark:text-sukoon-400 hover:text-sukoon-800 dark:hover:text-sukoon-300 inline-flex items-center gap-1"
              >
                <span>Create an account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-500">
          <ShieldCheck className="w-4 h-4 text-sukoon-600 dark:text-sukoon-400" />
          <span>Encrypted sessions & strict Row Level Security</span>
        </div>
      </div>
    </div>
  );
}

