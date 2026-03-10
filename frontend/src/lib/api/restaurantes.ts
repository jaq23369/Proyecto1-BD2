import { api } from "./client";
import type { Restaurante, PaginatedResponse, SingleResponse } from "@/types";

export const restaurantesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<PaginatedResponse<Restaurante>>(`/api/restaurantes${qs}`);
  },
  getById: (id: string) =>
    api.get<SingleResponse<Restaurante>>(`/api/restaurantes/${id}`),
  create: (data: Partial<Restaurante>) =>
    api.post<SingleResponse<{ insertedId: string }>>("/api/restaurantes", data),
  update: (id: string, data: Partial<Restaurante>) =>
    api.put(`/api/restaurantes/${id}`, data),
  addCategoria: (id: string, categoria: string) =>
    api.post(`/api/restaurantes/${id}/categorias`, { categoria }),
  statsCount: () =>
    api.get<SingleResponse<{ activos: number; inactivos: number; total: number; categorias_distintas: number }>>("/api/restaurantes/stats/count"),
  statsCategorias: () =>
    api.get<SingleResponse<string[]>>("/api/restaurantes/stats/categorias"),
};
