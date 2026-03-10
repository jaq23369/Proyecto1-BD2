"use client";
import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 focus:ring-brand-500",
  secondary:
    "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/80 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-300",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200",
  danger:
    "bg-rose-600 text-white shadow-sm shadow-rose-600/20 hover:bg-rose-700 focus:ring-rose-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-xs font-bold rounded-full gap-1.5",
  md: "px-6 py-2.5 text-sm font-bold rounded-full gap-2",
  lg: "px-8 py-3.5 text-base font-bold rounded-full gap-2.5",
};

const spinnerSize: Record<Size, number> = { sm: 13, md: 15, lg: 18 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      className,
      type = "button",
      onClick,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: isDisabled ? 1 : 0.97 }}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none",
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
      >
        {isLoading && (
          <Loader2
            size={spinnerSize[size]}
            className="animate-spin shrink-0"
          />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
