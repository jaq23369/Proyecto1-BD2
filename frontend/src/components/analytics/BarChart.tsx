"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BarItem {
  label: string;
  value: number;
  sublabel?: string;
}

interface BarChartProps {
  items: BarItem[];
  maxValue?: number;
  color?: string;
  title: string;
  className?: string;
}

export function BarChart({ items, maxValue, color, title, className }: BarChartProps) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 shadow-sm p-5", className)}>
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const pct = Math.max(2, (item.value / max) * 100);
            return (
              <div key={idx} className="flex items-center gap-3">
                {/* Label */}
                <div className="w-32 shrink-0">
                  <p className="text-xs text-gray-700 font-medium truncate" title={item.label}>
                    {item.label}
                  </p>
                  {item.sublabel && (
                    <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
                  )}
                </div>

                {/* Bar track */}
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ background: color ?? undefined }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.05 }}
                  />
                </div>

                {/* Value */}
                <div className="w-16 text-right shrink-0">
                  <span className="text-xs font-semibold text-gray-700">
                    {typeof item.value === "number" && item.value % 1 !== 0
                      ? item.value.toFixed(2)
                      : item.value.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
