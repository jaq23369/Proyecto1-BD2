"use client";
import { Badge } from "@/components/ui/Badge";
import type { EstadoOrden } from "@/types";

export const ESTADO_LABELS: Record<EstadoOrden, string> = {
  creada:         "Creada",
  confirmada:     "Confirmada",
  en_preparacion: "En preparacion",
  en_camino:      "En camino",
  entregada:      "Entregada",
  cancelada:      "Cancelada",
};

type BadgeVariant = "green" | "yellow" | "orange" | "red" | "blue" | "gray";

const ESTADO_VARIANT: Record<EstadoOrden, BadgeVariant> = {
  creada:         "gray",
  confirmada:     "blue",
  en_preparacion: "yellow",
  en_camino:      "orange",
  entregada:      "green",
  cancelada:      "red",
};

interface EstadoBadgeProps {
  estado: EstadoOrden;
  className?: string;
}

export function EstadoBadge({ estado, className }: EstadoBadgeProps) {
  return (
    <Badge variant={ESTADO_VARIANT[estado]} className={className}>
      {ESTADO_LABELS[estado]}
    </Badge>
  );
}
