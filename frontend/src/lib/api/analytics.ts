import { api } from "./client";

export const analyticsApi = {
  ventasPorMes: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<{ data: Array<{ restaurante_nombre: string; anio_mes: string; total_ventas: number; total_ordenes: number; ticket_promedio: number }> }>(`/api/analytics/ventas-por-mes${qs}`);
  },
  topProductos: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<{ data: Array<{ nombre_producto: string; restaurante_nombre: string; unidades_vendidas: number; ingresos_generados: number }> }>(`/api/analytics/top-productos${qs}`);
  },
  ratings: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<{ data: Array<{ restaurante_nombre: string; rating_promedio: number; total_resenas: number; promedio_sabor: number; promedio_tiempo_entrega: number; promedio_presentacion: number }> }>(`/api/analytics/ratings${qs}`);
  },
  funnelOrdenes: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<{ data: Array<{ estado_orden: string; total: number; total_ordenes: number; porcentaje: number }> }>(`/api/analytics/funnel-ordenes${qs}`);
  },
  tiemposEstado: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<{ data: Array<{ restaurante_nombre: string; ordenes_analizadas: number; prom_creada_confirmada: number; prom_confirmada_preparacion: number; prom_preparacion_camino: number; prom_camino_entregada: number }> }>(`/api/analytics/tiempos-estado${qs}`);
  },
};
