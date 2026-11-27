import Link from "next/link";
import { HeartHandshake, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center bg-warm-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sukoon-500 to-teal-700 flex items-center justify-center text-white mb-4 shadow-sm">
        <HeartHandshake className="w-8 h-8" />
      </div>

      <h2 className="text-3xl font-extrabold tracking-tight">Page Not Found</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md">
        This path does not exist or has been moved. Let&apos;s guide you back to a calm space.
      </p>

      <div className="mt-6">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

