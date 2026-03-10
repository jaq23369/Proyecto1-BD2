"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarSize = "sm" | "md";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  size?: StarSize;
}

const sizeMap: Record<StarSize, number> = {
  sm: 13,
  md: 16,
};

export function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const starSize = sizeMap[size];
  const interactive = typeof onChange === "function";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => onChange(star) : undefined}
            disabled={!interactive}
            className={cn(
              "transition-transform duration-100",
              interactive
                ? "cursor-pointer hover:scale-110 focus:outline-none"
                : "cursor-default"
            )}
            aria-label={`${star} estrella${star !== 1 ? "s" : ""}`}
          >
            <Star
              size={starSize}
              className={cn(
                filled
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-300 fill-gray-100"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
