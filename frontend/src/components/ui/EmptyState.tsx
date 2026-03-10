"use client";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  title = "Sin resultados",
  description = "No se encontraron registros para los filtros aplicados.",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-24 px-4 text-center bg-white/50 backdrop-blur-md rounded-3xl border border-slate-100 shadow-soft",
        className
      )}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 mb-5 relative group">
        <div className="absolute inset-0 bg-brand-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 ease-out" />
        <SearchX size={32} className="text-slate-400 relative z-10 group-hover:text-brand-500 transition-colors duration-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm font-medium">{description}</p>
    </div>
  );
}
