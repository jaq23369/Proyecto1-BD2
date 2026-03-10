"use client";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  ChefHat,
  Truck,
  Package,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ESTADO_LABELS } from "@/components/ordenes/EstadoBadge";
import type { HistorialEstado, EstadoOrden } from "@/types";

interface OrdenTimelineProps {
  historial: HistorialEstado[];
}

const ESTADO_ICON: Record<EstadoOrden, React.ReactNode> = {
  creada:         <Clock size={15} />,
  confirmada:     <CheckCircle size={15} />,
  en_preparacion: <ChefHat size={15} />,
  en_camino:      <Truck size={15} />,
  entregada:      <Package size={15} />,
  cancelada:      <XCircle size={15} />,
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden:  { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
};

export function OrdenTimeline({ historial }: OrdenTimelineProps) {
  if (!historial || historial.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">Sin historial de estados.</p>
    );
  }

  const lastIdx = historial.length - 1;

  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-0"
    >
      {historial.map((entry, idx) => {
        const isLast = idx === lastIdx;
        const estado = entry.estado as EstadoOrden;

        return (
          <motion.li
            key={idx}
            variants={itemVariants}
            className="flex gap-4 relative"
          >
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100" />
            )}

            {/* Icon */}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-1 ${
                isLast
                  ? "bg-amber-100 text-amber-600 ring-2 ring-amber-200"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {ESTADO_ICON[estado] ?? <Clock size={15} />}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1">
              <p
                className={`text-sm font-semibold ${
                  isLast ? "text-amber-700" : "text-gray-700"
                }`}
              >
                {ESTADO_LABELS[estado] ?? estado}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(entry.fecha)}
              </p>
              {entry.usuario_evento && (
                <p className="text-xs text-gray-400">
                  Por: {entry.usuario_evento}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
