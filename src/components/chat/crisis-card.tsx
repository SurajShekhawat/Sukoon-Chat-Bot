import React from "react";
import { PhoneCall, ExternalLink, ShieldAlert, Heart } from "lucide-react";
import { EmergencyHelpline } from "@/types/safety";
import { LanguageCode } from "@/types/database";

interface CrisisCardProps {
  helplines: EmergencyHelpline[];
  language?: LanguageCode;
}

export function CrisisCard({ helplines, language = "hinglish" }: CrisisCardProps) {
  const headline = {
    en: "You are not alone. Immediate caring support is available.",
    hi: "आप अकेले नहीं हैं। कृपया अभी सहायता के लिए संपर्क करें।",
    hinglish: "Aap akele nahi hain. Please abhi kisi se baat karein, hum aapke sath hain.",
  }[language];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="p-5 my-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-warm-50 to-orange-50/70 dark:from-amber-950/40 dark:via-slate-900/60 dark:to-orange-950/20 border-2 border-amber-300 dark:border-amber-700/80 shadow-md text-slate-900 dark:text-slate-100 animate-message-enter"
    >
      <div className="flex items-center gap-2.5 mb-2.5 text-amber-800 dark:text-amber-400 font-semibold text-base sm:text-lg">
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
        </div>
        <span>{headline}</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
        Sukoon AI is an automated wellness companion and cannot substitute for professional human emergency care or medical treatment. Free, confidential support is available right now:
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {helplines.map((helpline) => (
          <div
            key={helpline.id}
            className="p-4 bg-white dark:bg-slate-900/90 rounded-xl border border-amber-200/80 dark:border-amber-800/60 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {helpline.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 shrink-0 font-medium">
                  {helpline.availableHours}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {helpline.description}
              </p>
            </div>

            <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <a
                href={`tel:${helpline.number.replace(/[^0-9+]/g, "")}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-2xs active:scale-95"
                aria-label={`Call ${helpline.name} at ${helpline.number}`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {helpline.number}</span>
              </a>
              {helpline.website && (
                <a
                  href={helpline.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline ml-auto"
                >
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-amber-800/40 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
        <span>Your life and emotional wellbeing matter deeply. Please connect with someone who can support you today.</span>
      </div>
    </div>
  );
}
