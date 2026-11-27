import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "danger" | "calm";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-sukoon-100 text-sukoon-800 dark:bg-sukoon-950 dark:text-sukoon-300",
    secondary: "bg-warm-100 text-warm-800 dark:bg-slate-800 dark:text-slate-300",
    outline: "border border-warm-300 dark:border-slate-700 text-slate-700 dark:text-slate-300",
    danger: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    calm: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}

