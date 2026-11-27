import React from "react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  showTagline?: boolean;
  href?: string;
}

export function SukoonIcon({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Primary calming teal to cyan ocean gradient */}
        <linearGradient id="sukoonTealGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        {/* Soft inner glow gradient for warmth & empathy */}
        <linearGradient id="sukoonWarmthGrad" x1="16" y1="12" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#fb923c" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.95" />
        </linearGradient>

        {/* Outer drop shadow */}
        <filter id="sukoonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0d9488" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Background Soft Pill Container */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="14"
        fill="url(#sukoonTealGrad)"
        filter="url(#sukoonGlow)"
      />

      {/* Gentle Wave Flow Reflection Behind */}
      <path
        d="M10 28C14 20 22 20 26 26C30 32 38 30 40 24"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.2"
      />

      {/* Emblem: Intertwined Compassionate Heart & Soothing Lotus Petal */}
      {/* Left Heart Petal */}
      <path
        d="M24 37C24 37 13 29.5 13 20.5C13 16.3579 16.3579 13 20.5 13C22.65 13 24 14.5 24 14.5C24 14.5 25.35 13 27.5 13C31.6421 13 35 16.3579 35 20.5C35 29.5 24 37 24 37Z"
        fill="white"
        fillOpacity="0.96"
      />

      {/* Inner Heart Warmth Accent */}
      <path
        d="M24 33C24 33 16.5 27.5 16.5 21C16.5 18 18.8 15.8 21.6 15.8C23.1 15.8 24 16.8 24 16.8C24 16.8 24.9 15.8 26.4 15.8C29.2 15.8 31.5 18 31.5 21C31.5 27.5 24 33 24 33Z"
        fill="url(#sukoonWarmthGrad)"
      />

      {/* Peaceful Breath Sparkle / Serenity Star */}
      <circle cx="24" cy="21.5" r="2.2" fill="white" />
      <circle cx="24" cy="21.5" r="1.2" fill="#fff" />
      <path
        d="M24 17.5V18.5M24 24.5V25.5M20 21.5H21M27 21.5H28"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SukoonLogo({
  className = "",
  size = "md",
  showText = true,
  showTagline = true,
  href,
}: LogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const content = (
    <div className={`flex items-center gap-3 group transition-transform duration-200 ${className}`}>
      <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
        <SukoonIcon className={iconSizes[size]} />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold tracking-tight text-slate-900 dark:text-slate-100 ${textSizes[size]}`}
            >
              Sukoon <span className="text-sukoon-600 dark:text-sukoon-400 font-black">AI</span>
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-sukoon-700 dark:text-sukoon-300 bg-sukoon-100/80 dark:bg-sukoon-950/80 px-2 py-0.5 rounded-full border border-sukoon-200 dark:border-sukoon-800/80">
              सुकून
            </span>
          </div>

          {showTagline && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-normal -mt-0.5">
              Empathetic Multilingual Companion
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}

