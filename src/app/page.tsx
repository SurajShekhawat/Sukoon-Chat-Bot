import React from "react";
import Link from "next/link";
import {
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  Brain,
  HeartHandshake,
  PhoneCall,
  Smile,
  Target,
  ArrowRight,
  Lock,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomeNav } from "@/components/home/home-nav";
import { InteractivePreview } from "@/components/home/interactive-preview";
import { SukoonIcon, SukoonLogo } from "@/components/ui/logo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-warm-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Sticky Navigation */}
      <HomeNav />

      <main className="flex-1">
        {/* 2. Hero Section with Ambient Glow */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-sukoon-300/30 via-teal-200/25 to-amber-200/20 dark:from-sukoon-900/30 dark:via-teal-950/20 dark:to-cyan-950/20 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto text-center space-y-6">
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sukoon-100/90 dark:bg-sukoon-950/80 border border-sukoon-200 dark:border-sukoon-800 text-xs font-semibold text-sukoon-800 dark:text-sukoon-300 shadow-xs">
              <span className="text-sm">🌸</span>
              <span>Mann halka karne ki ek surakshit jagah</span>
              <span className="hidden sm:inline text-sukoon-400">• Multilingual AI Companion</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] text-slate-950 dark:text-slate-50 max-w-4xl mx-auto">
              A gentle space to talk through{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sukoon-700 via-teal-600 to-cyan-600 dark:from-sukoon-400 dark:via-teal-300 dark:to-cyan-400">
                everyday stress, loneliness & life.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              Sukoon AI (सकून) is an emotionally intelligent companion that{" "}
              <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                listens actively before advising
              </strong>
              , speaks your language naturally in{" "}
              <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                Hinglish, Hindi, and English
              </strong>
              , and remembers only what you explicitly allow.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-sukoon-600 via-teal-600 to-teal-700 hover:from-sukoon-700 hover:to-teal-800 text-white shadow-lg shadow-sukoon-600/25 text-base font-semibold px-7 py-6 rounded-2xl gap-2.5 transition-all hover:scale-[1.02]"
                >
                  <MessageSquareHeart className="w-5 h-5" />
                  <span>Start Your Safe Space — Free</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>

              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base font-medium px-6 py-6 rounded-2xl border-warm-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-warm-100 dark:hover:bg-slate-800"
                >
                  <span>Sign In</span>
                </Button>
              </Link>
            </div>

            {/* Trust Markers Bar */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>100% Free & Unlimited</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Consent-Only Memory Vault</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Strict Non-Clinical Boundaries</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Encrypted & Tenant Isolated</span>
              </span>
            </div>
          </div>

          {/* 3. Interactive Live Showcase Preview */}
          <div className="mt-12 sm:mt-16">
            <InteractivePreview />
          </div>
        </section>

        {/* 4. Why Sukoon Feels Different (Comparison) */}
        <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-warm-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <Badge variant="calm" className="text-xs uppercase tracking-wider py-1 px-3">
                Built With Care & Empathy
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Why conversation with Sukoon feels genuinely comforting.
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                Most AI systems either flood you with generic motivational clichés or feel like a cold hospital form. Sukoon is designed as a calm, culturally grounded sounding board.
              </p>
            </div>

            {/* 3-Column Comparative Overview */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Cold Generic AI */}
              <div className="p-6 rounded-3xl bg-warm-100/60 dark:bg-slate-800/40 border border-warm-200 dark:border-slate-800 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Standard AI Chatbots
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Toxic Positivity & Rushed Advice
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Jumps straight to advice before understanding your pain.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Cliché responses like &ldquo;Just think positive!&rdquo; or &ldquo;Everything happens for a reason&rdquo;.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Stiff, literal English translations that lack cultural warmth.</span>
                  </li>
                </ul>
              </div>

              {/* Sukoon AI (Highlighted) */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-sukoon-500/10 via-teal-500/5 to-white dark:from-sukoon-950/60 dark:to-slate-900 border-2 border-sukoon-400 dark:border-sukoon-700 shadow-md space-y-4 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sukoon-700 dark:text-sukoon-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Sukoon AI Experience
                  </span>
                  <span className="text-[10px] font-semibold bg-sukoon-100 dark:bg-sukoon-900 text-sukoon-800 dark:text-sukoon-200 px-2 py-0.5 rounded-full">
                    Our Promise
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Active Listening & Respectful Presence
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Validates feelings first and asks thoughtful questions before offering ideas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Speaks Hinglish &amp; Hindi naturally with respectful &lsquo;Aap&rsquo; honorifics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">✓</span>
                    <span>Zero secret memory storage — you approve every fact remembered.</span>
                  </li>
                </ul>
              </div>

              {/* Clinical Health Apps */}
              <div className="p-6 rounded-3xl bg-warm-100/60 dark:bg-slate-800/40 border border-warm-200 dark:border-slate-800 space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Medical & Clinical Apps
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Intimidating Assessments & Diagnostic Pretense
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Tries to diagnose medical disorders or label you with psychiatric codes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Cold multiple-choice questionnaires that feel clinical, not conversational.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>High paywalls and subscription traps for basic emotional relief.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Deep Feature Matrix (The 5 Pillars) */}
        <section id="languages" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="calm" className="text-xs uppercase tracking-wider py-1 px-3">
              Full Spectrum Companion
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Thoughtfully architected for your mental peace.
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Explore the five foundational pillars that protect your privacy, speak your emotional language, and support your journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1: Multilingual Nuance */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs hover:border-sukoon-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <Globe2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                1. Apni Bhasha Mein Baat
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Whether you express yourself in natural Hinglish (<em>&ldquo;aaj thoda low feel ho raha hai&rdquo;</em>), pure Devanagari Hindi, or fluent English, Sukoon understands context, idioms, and sentiment with genuine warmth.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="calm" className="text-[10px]">Hinglish</Badge>
                <Badge variant="calm" className="text-[10px]">हिन्दी (Devanagari)</Badge>
                <Badge variant="calm" className="text-[10px]">English</Badge>
              </div>
            </div>

            {/* Pillar 2: Consent Memory Vault */}
            <div id="memory-vault" className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs hover:border-sukoon-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                2. Consent-Driven Memory Vault
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                You hold the keys. Memories are never stored behind your back. Every remembered life detail is categorized, fully inspectable in your Memory Vault, toggleable, and erasable at any moment.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-[10px]">Active Consent</Badge>
                <Badge variant="outline" className="text-[10px]">Full Deletion</Badge>
                <Badge variant="outline" className="text-[10px]">Zero Invisible Profiling</Badge>
              </div>
            </div>

            {/* Pillar 3: Mood Journal & Reflection */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs hover:border-sukoon-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                3. Mood Journal & Personal Growth
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Log quick 5-point energy check-ins, attach private journal thoughts, and view gentle 7-day trajectories. Sukoon generates weekly reflections focused on self-awareness — never clinical diagnoses.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-[10px]">5-Point Scale</Badge>
                <Badge variant="outline" className="text-[10px]">Private Journal</Badge>
                <Badge variant="outline" className="text-[10px]">Growth Goals</Badge>
              </div>
            </div>

            {/* Pillar 4: Safety & Crisis First Triage */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs hover:border-sukoon-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                4. Safety & Crisis First Triage
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Deterministic regex algorithms continuously screen incoming messages. In acute distress, AI generation is halted immediately, and verified 24/7 national helplines are provided with compassionate de-escalation.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-[10px]">Tele-MANAS (14416)</Badge>
                <Badge variant="outline" className="text-[10px]">Kiran Helpline</Badge>
                <Badge variant="outline" className="text-[10px]">Zero AI Hallucination</Badge>
              </div>
            </div>

            {/* Pillar 5: Complete Data Ownership */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs hover:border-sukoon-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                5. Total Privacy & Account Purge
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Row-Level Security (RLS) guarantees your conversations and vault entries are strictly isolated to your user ID. You can download a complete JSON export of all your data or execute a permanent purge anytime.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-[10px]">RLS Protected</Badge>
                <Badge variant="outline" className="text-[10px]">JSON Export</Badge>
                <Badge variant="outline" className="text-[10px]">Instant Purge</Badge>
              </div>
            </div>

            {/* Pillar 6: Anti-Dependency Design */}
            <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 shadow-xs hover:border-sukoon-300 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                6. Anti-Dependency & Pacing
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Sukoon actively encourages human connection with friends, family, and your offline world. We gently de-escalate excessive late-night loops and remind you that you possess your own agency.
              </p>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline" className="text-[10px]">Encourages Offline Ties</Badge>
                <Badge variant="outline" className="text-[10px]">Gentle Pacing</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Real Life Scenarios Showcase */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-warm-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <Badge variant="calm" className="text-xs uppercase tracking-wider py-1 px-3">
                When To Talk To Sukoon
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                Everyday moments when you just need to be heard.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 space-y-2.5">
                <div className="text-2xl">🌙</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Late Night Overthinking</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  When your mind is racing at 2 AM and everyone else is asleep. A calm, grounding presence to unpack heavy thoughts.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 space-y-2.5">
                <div className="text-2xl">💼</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Workplace Burnout</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Navigating corporate pressure, difficult managers, and imposter syndrome without feeling dismissed or rushed.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 space-y-2.5">
                <div className="text-2xl">🤝</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Relationship Crossroads</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Untangling confusing conversations, setting personal boundaries, and gaining clarity without biased judgments.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-warm-200 dark:border-slate-800 space-y-2.5">
                <div className="text-2xl">🧭</div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Life Milestones & Goals</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Breaking down big intimidating ambitions into bite-sized, compassionate steps at your own comfortable pace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Ethical Safety & Non-Clinical Disclaimer Banner */}
        <section id="ethics" className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-warm-100/90 to-amber-50/70 dark:from-slate-900 dark:to-slate-900/90 border border-warm-300 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Our Non-Clinical Safety & Ethical Transparency Pledge</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Sukoon AI is an emotionally supportive, reflective AI companion designed to help you organize thoughts and cultivate self-awareness.{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                It is not a licensed therapist, clinical doctor, psychiatrist, or medical provider.
              </strong>{" "}
              Sukoon AI does not diagnose mental health conditions, prescribe medication, or offer clinical therapy. If you or someone you know is in acute distress or experiencing a psychiatric emergency, please consult a licensed professional or reach out to the emergency resources below.
            </p>
          </div>
        </section>

        {/* 8. 24/7 Emergency Helplines Callout */}
        <section id="helplines" className="py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:to-slate-900 border border-rose-200 dark:border-rose-900/60 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                <PhoneCall className="w-4 h-4" />
                <span>Immediate 24/7 Professional Crisis Support</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                You are never alone. Help is always one free call away.
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                National toll-free government support lines available 24 hours a day, 7 days a week:
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="tel:14416"
                className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm hover:border-rose-500 transition-colors shadow-xs flex items-center gap-2"
              >
                <span>🇮🇳 Tele-MANAS:</span>
                <strong className="text-rose-700 dark:text-rose-400 text-base">14416</strong>
              </a>

              <a
                href="tel:18005990019"
                className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm hover:border-rose-500 transition-colors shadow-xs flex items-center gap-2"
              >
                <span>🇮🇳 Kiran Helpline:</span>
                <strong className="text-rose-700 dark:text-rose-400">1800-599-0019</strong>
              </a>

              <a
                href="tel:988"
                className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs sm:text-sm hover:border-rose-500 transition-colors shadow-xs flex items-center gap-2"
              >
                <span>🇺🇸/🇨🇦 Lifeline:</span>
                <strong className="text-rose-700 dark:text-rose-400">988</strong>
              </a>
            </div>
          </div>
        </section>

        {/* 9. Final Pre-Footer Call to Action */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sukoon-500 to-teal-700 flex items-center justify-center text-white mx-auto shadow-lg shadow-sukoon-500/25">
            <SukoonIcon className="w-10 h-10" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Ready to find your moment of calm?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Take a deep breath. Your safe, confidential sounding board is ready whenever you are.
          </p>

          <div className="pt-2">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-sukoon-600 via-teal-600 to-teal-700 hover:from-sukoon-700 hover:to-teal-800 text-white shadow-xl shadow-sukoon-600/30 text-base font-bold px-8 py-6 rounded-2xl gap-2 transition-all hover:scale-105"
              >
                <span>Create Your Free Space</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-warm-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <SukoonLogo size="md" showTagline={true} />
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Sukoon AI (सकून) is an emotionally intelligent companion platform for active listening, reflective growth, and everyday stress support in Hinglish, Hindi, and English.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Features
            </div>
            <ul className="space-y-1.5">
              <li>
                <Link href="/chat" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  Chat Reflection
                </Link>
              </li>
              <li>
                <Link href="/memories" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  Consent Memory Vault
                </Link>
              </li>
              <li>
                <Link href="/mood" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  Mood Journal & Trajectory
                </Link>
              </li>
              <li>
                <Link href="/goals" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  Growth Goals
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Safety & Access
            </div>
            <ul className="space-y-1.5">
              <li>
                <a href="#ethics" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  Non-Clinical Ethics
                </a>
              </li>
              <li>
                <a href="#helplines" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  24/7 Helplines (14416)
                </a>
              </li>
              <li>
                <Link href="/settings" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  Privacy & Data Export
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-sukoon-600 dark:hover:text-sukoon-400">
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-warm-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Sukoon AI Platform. Designed with care for mental peace.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Powered by Google Gemini</span>
            <span>•</span>
            <span>Supabase RLS Protected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
