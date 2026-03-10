import { api } from "./client";
import type { Orden, EstadoOrden, PaginatedResponse, SingleResponse } from "@/types";

export const ordenesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<PaginatedResponse<Orden>>(`/api/ordenes${qs}`);
  },
  getById: (id: string) =>
    api.get<SingleResponse<Orden>>(`/api/ordenes/${id}`),
  create: (data: {
    usuario_id: string;
    restaurante_id: string;
    items: Array<{ menu_item_id: string; cantidad: number }>;
    costo_envio?: number;
    metodo_pago?: string;
    notas_cliente?: string;
    direccion_entrega?: object;
  }) => api.post<SingleResponse<{ orden_id: string; total: number }>>("/api/ordenes", data),
  updateEstado: (id: string, estado_orden: EstadoOrden, usuario_evento?: string) =>
    api.patch(`/api/ordenes/${id}`, { estado_orden, usuario_evento }),
  statsCount: () =>
    api.get<SingleResponse<{ total: number; entregadas: number; canceladas: number }>>("/api/ordenes/stats/count"),
};
