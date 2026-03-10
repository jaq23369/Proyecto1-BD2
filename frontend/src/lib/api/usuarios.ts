import { api } from "./client";
import type { Usuario, Direccion, PaginatedResponse, SingleResponse } from "@/types";

export const usuariosApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<PaginatedResponse<Usuario>>(`/api/usuarios${qs}`);
  },
  getById: (id: string) =>
    api.get<SingleResponse<Usuario>>(`/api/usuarios/${id}`),
  update: (id: string, data: Partial<Usuario>) =>
    api.put(`/api/usuarios/${id}`, data),
  deleteInactive: () =>
    api.delete<SingleResponse<{ deletedCount: number }>>("/api/usuarios/inactive"),
  addDireccion: (id: string, direccion: Direccion) =>
    api.post(`/api/usuarios/${id}/direcciones`, direccion),
  removeDireccion: (id: string, alias: string) =>
    api.delete(`/api/usuarios/${id}/direcciones/${encodeURIComponent(alias)}`),
  statsCount: () =>
    api.get<SingleResponse<{ activos: number; inactivos: number; total: number }>>("/api/usuarios/stats/count"),
};
