"use client";

import React, { useState } from "react";
import {
  Sparkles,
  MessageSquareHeart,
  Brain,
  Smile,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SukoonIcon } from "@/components/ui/logo";

interface Scenario {
  id: string;
  lang: "hinglish" | "hi" | "en";
  langLabel: string;
  tag: string;
  userMessage: string;
  assistantResponse: string;
  moodBadge: string;
  memoryBadge: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "hinglish",
    lang: "hinglish",
    langLabel: "Hinglish (Natural Blend)",
    tag: "Everyday Burnout",
    userMessage: "Yaar aaj office mein itna burnout feel ho raha tha... lagta hai koi samajhta hi nahi.",
    assistantResponse:
      "Arrey dost, pehle ek gehri saans lo... relax. Burnout sach mein bohot draining hota hai, puri mental energy nichod leta hai. 🫂 Main yahan poori tarah se aapki baat sun raha hoon. Aaram se batao, aaj kis baat ne sabse zyada overwhelm kiya?",
    moodBadge: "Energy: 2/5 • Emotion: Drained, Exhausted",
    memoryBadge: "Vault: Working on engineering career transition",
  },
  {
    id: "hi",
    lang: "hi",
    langLabel: "हिन्दी (Devanagari)",
    tag: "मानसिक तनाव व अकेलापन",
    userMessage: "नमस्ते सुकून, आज मन बहुत भारी लग रहा है। समझ नहीं आ रहा किससे बात करूँ।",
    assistantResponse:
      "नमस्ते। मैं आपकी बात पूरे ध्यान और आदर से सुन रहा हूँ। कभी-कभी बिना किसी बड़ी वजह के भी मन भारी हो सकता है, और यह महसूस करना बिल्कुल स्वाभाविक है। 🌿 आप बिना किसी झिझक के बताइए, आज क्या बात मन में बार-बार आ रही है?",
    moodBadge: "ऊर्जा: 2/5 • भाव: शांत रहने का प्रयास",
    memoryBadge: "मेमोरी वॉल्ट: सहमति से सक्रिय (1 याद)",
  },
  {
    id: "en",
    lang: "en",
    langLabel: "English (Reflective)",
    tag: "Career Crossroads",
    userMessage: "I feel like I'm falling behind in everything. Work, health, relationships. It's just too much.",
    assistantResponse:
      "It takes real honesty to admit when things feel heavy. When every area of life demands energy simultaneously, feeling behind is a very human response — not a personal failure. 🤍 Let's pause and breathe for a second. If you could set down just one burden right now, what would it be?",
    moodBadge: "Energy: 2/5 • Emotion: Anxious, Overwhelmed",
    memoryBadge: "Vault: Reflecting on long-term life priorities",
  },
];

export function InteractivePreview() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleScenarioChange = (scenario: Scenario) => {
    if (scenario.id === selectedScenario.id) return;
    setIsTyping(true);
    setSelectedScenario(scenario);
    setTimeout(() => {
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-white to-warm-50/70 dark:from-slate-900 dark:to-slate-950 border border-warm-200/80 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Top Interactive Bar */}
      <div className="px-5 py-4 border-b border-warm-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Interactive Experience
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">• Try different languages</span>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-warm-100/80 dark:bg-slate-800/80 rounded-2xl">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleScenarioChange(item)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                selectedScenario.id === item.id
                  ? "bg-white dark:bg-slate-900 text-sukoon-800 dark:text-sukoon-300 shadow-sm font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {item.langLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Simulated Chat Interface */}
      <div className="p-5 sm:p-7 space-y-5">
        {/* Context metadata pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900/60 text-teal-800 dark:text-teal-300 font-medium">
            <Brain className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{selectedScenario.memoryBadge}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 font-medium">
            <Smile className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{selectedScenario.moodBadge}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium ml-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Non-Clinical • Active Listening</span>
          </div>
        </div>

        {/* User Message Bubble */}
        <div className="flex justify-end">
          <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-sukoon-600 to-teal-700 text-white px-4 py-3 shadow-sm text-sm leading-relaxed">
            <p>{selectedScenario.userMessage}</p>
            <span className="text-[10px] text-sukoon-200/80 block mt-1 text-right">Just now</span>
          </div>
        </div>

        {/* Companion Response Bubble */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1">
            <SukoonIcon className="w-8 h-8" />
          </div>

          <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800/90 border border-warm-200 dark:border-slate-700/80 p-4 shadow-sm text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
            {isTyping ? (
              <div className="flex items-center gap-1.5 py-2 px-1">
                <span className="w-2 h-2 rounded-full bg-sukoon-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-sukoon-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-sukoon-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            ) : (
              <>
                <p className="whitespace-pre-line">{selectedScenario.assistantResponse}</p>
                <div className="mt-3 pt-2.5 border-t border-warm-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-sukoon-600 dark:text-sukoon-400 font-medium">
                    Sukoon AI • Validating before advising
                  </span>
                  <span>Free • Gemini Powered</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sample Prompt Quick Taps */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Try reflecting on:
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleScenarioChange(item)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedScenario.id === item.id
                    ? "bg-sukoon-50 dark:bg-sukoon-950/60 border-sukoon-300 dark:border-sukoon-800 text-sukoon-800 dark:text-sukoon-200 font-medium"
                    : "bg-white dark:bg-slate-800 border-warm-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-sukoon-300"
                }`}
              >
                💭 {item.tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

