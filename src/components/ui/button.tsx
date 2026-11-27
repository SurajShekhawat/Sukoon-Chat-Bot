import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sukoon-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

    const variantStyles = {
      primary: "bg-sukoon-600 hover:bg-sukoon-700 text-white shadow-sm hover:shadow",
      secondary: "bg-warm-100 hover:bg-warm-200 text-warm-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
      outline: "border border-warm-300 dark:border-slate-700 hover:bg-warm-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200",
      ghost: "hover:bg-warm-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm",
    }[variant];

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles, sizeStyles, className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

