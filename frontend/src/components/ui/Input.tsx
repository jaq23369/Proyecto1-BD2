"use client";
import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400",
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200 hover:border-gray-300",
            props.disabled && "bg-gray-50 cursor-not-allowed opacity-60",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-400 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
