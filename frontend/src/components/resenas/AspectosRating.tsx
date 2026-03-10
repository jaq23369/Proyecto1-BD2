"use client";
import { StarRating } from "@/components/ui/StarRating";

interface Aspectos {
  sabor: number;
  tiempo_entrega: number;
  presentacion: number;
}

interface AspectosRatingProps {
  value: Aspectos;
  onChange?: (updated: Aspectos) => void;
}

const LABELS: Record<keyof Aspectos, string> = {
  sabor:          "Sabor",
  tiempo_entrega: "Tiempo de entrega",
  presentacion:   "Presentacion",
};

export function AspectosRating({ value, onChange }: AspectosRatingProps) {
  const isInteractive = typeof onChange === "function";

  function handleChange(field: keyof Aspectos, val: number) {
    if (onChange) {
      onChange({ ...value, [field]: val });
    }
  }

  return (
    <div className="space-y-3">
      {(Object.keys(LABELS) as (keyof Aspectos)[]).map((field) => (
        <div key={field} className="flex items-center justify-between gap-4">
          <span className="text-sm text-gray-600 min-w-[130px]">{LABELS[field]}</span>
          <div className="flex items-center gap-2">
            <StarRating
              value={value[field]}
              onChange={isInteractive ? (v) => handleChange(field, v) : undefined}
              size="md"
            />
            <span className="text-sm text-gray-400 w-6 text-right">{value[field]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
