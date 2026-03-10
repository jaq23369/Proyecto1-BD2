"use client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 36,
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <Loader2
      size={sizeMap[size]}
      className={cn("animate-spin text-amber-500", className)}
    />
  );
}
