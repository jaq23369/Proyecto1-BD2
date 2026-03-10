import { api } from "./client";
import type { Resena, PaginatedResponse, SingleResponse } from "@/types";

export const resenasApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<PaginatedResponse<Resena>>(`/api/resenas${qs}`);
  },
  getById: (id: string) =>
    api.get<SingleResponse<Resena>>(`/api/resenas/${id}`),
  create: (data: {
    orden_id: string;
    usuario_id: string;
    calificacion: number;
    comentario?: string;
    aspectos?: { sabor: number; tiempo_entrega: number; presentacion: number };
  }) => api.post<SingleResponse<{ resena_id: string; rating_promedio: number }>>("/api/resenas", data),
  delete: (id: string) =>
    api.delete(`/api/resenas/${id}`),
};
