"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SukoonLogo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight, HeartHandshake, PhoneCall } from "lucide-react";

export function HomeNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-warm-50/85 dark:bg-slate-950/85 border-b border-warm-200/80 dark:border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
        {/* Brand Logo */}
        <SukoonLogo href="/" size="md" showTagline={true} />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#features"
            className="hover:text-sukoon-700 dark:hover:text-sukoon-300 transition-colors"
          >
            Features
          </a>
          <a
            href="#languages"
            className="hover:text-sukoon-700 dark:hover:text-sukoon-300 transition-colors"
          >
            Languages
          </a>
          <a
            href="#memory-vault"
            className="hover:text-sukoon-700 dark:hover:text-sukoon-300 transition-colors"
          >
            Memory Vault
          </a>
          <a
            href="#ethics"
            className="hover:text-sukoon-700 dark:hover:text-sukoon-300 transition-colors"
          >
            Safety & Ethics
          </a>
          <a
            href="#helplines"
            className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-semibold transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>24/7 Helplines</span>
          </a>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-slate-700 dark:text-slate-200">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="bg-gradient-to-r from-sukoon-600 to-teal-700 hover:from-sukoon-700 hover:to-teal-800 text-white shadow-md shadow-sukoon-500/20 font-semibold gap-1.5 rounded-xl px-4"
            >
              <span>Start Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/signup">
            <Button size="sm" className="text-xs px-3 py-1.5 rounded-xl">
              Start Free
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-warm-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 pt-3 pb-6 space-y-3 backdrop-blur-md">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-warm-100 dark:hover:bg-slate-800"
            >
              Features
            </a>
            <a
              href="#languages"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-warm-100 dark:hover:bg-slate-800"
            >
              Multilingual (Hinglish, Hindi, English)
            </a>
            <a
              href="#memory-vault"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-warm-100 dark:hover:bg-slate-800"
            >
              Consent Memory Vault
            </a>
            <a
              href="#ethics"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl hover:bg-warm-100 dark:hover:bg-slate-800"
            >
              Non-Clinical Safety Pledge
            </a>
            <a
              href="#helplines"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Emergency 24/7 Helplines (14416)</span>
            </a>
          </nav>

          <div className="pt-3 border-t border-warm-200 dark:border-slate-800 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full justify-center bg-gradient-to-r from-sukoon-600 to-teal-700 text-white">
                Create Safe Space (Free)
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

