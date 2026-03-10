"use client";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeVariant =
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "blue"
  | "gray"
  | "purple";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: "bg-emerald-50/80 text-emerald-600 border-emerald-100 ring-1 ring-emerald-500/10",
  yellow: "bg-amber-50/80 text-amber-600 border-amber-100 ring-1 ring-amber-500/10",
  orange: "bg-brand-50/80 text-brand-600 border-brand-100 ring-1 ring-brand-500/10",
  red: "bg-rose-50/80 text-rose-600 border-rose-100 ring-1 ring-rose-500/10",
  blue: "bg-blue-50/80 text-blue-600 border-blue-100 ring-1 ring-blue-500/10",
  gray: "bg-slate-50/80 text-slate-600 border-slate-100 ring-1 ring-slate-500/10",
  purple: "bg-purple-50/80 text-purple-600 border-purple-100 ring-1 ring-purple-500/10",
};

export function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
