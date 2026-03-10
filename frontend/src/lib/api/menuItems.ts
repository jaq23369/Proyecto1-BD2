import { api } from "./client";
import type { MenuItem, PaginatedResponse, SingleResponse } from "@/types";

export const menuItemsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<PaginatedResponse<MenuItem>>(`/api/menu-items${qs}`);
  },
  getById: (id: string) =>
    api.get<SingleResponse<MenuItem>>(`/api/menu-items/${id}`),
  create: (data: Partial<MenuItem> | Partial<MenuItem>[]) =>
    api.post<SingleResponse<{ insertedId?: string; insertedCount?: number }>>("/api/menu-items", data),
  update: (id: string, data: Partial<MenuItem>) =>
    api.put(`/api/menu-items/${id}`, data),
  delete: (id: string) =>
    api.delete(`/api/menu-items/${id}`),
  addTag: (id: string, tag: string) =>
    api.post(`/api/menu-items/${id}/tags`, { tag }),
  removeTag: (id: string, tag: string) =>
    api.delete(`/api/menu-items/${id}/tags/${encodeURIComponent(tag)}`),
  bulkDisable: (data: { restaurante_id?: string; umbral?: number }) =>
    api.patch("/api/menu-items/bulk-disable", data),
  bulkPrice: (data: { categoria: string; porcentaje: number }) =>
    api.patch("/api/menu-items/bulk-price", data),
  statsCount: () =>
    api.get<SingleResponse<{ disponibles: number; no_disponibles: number; total: number }>>("/api/menu-items/stats/count"),
  uploadImagen: (id: string, file: File, principal = false) => {
    const form = new FormData();
    form.append("file", file);
    form.append("principal", String(principal));
    return api.post<{ data: { url: string; principal: boolean }[] }>(`/api/menu-items/${id}/imagen`, form);
  },
  deleteImagen: (id: string, url: string) =>
    api.delete<{ data: { url: string; principal: boolean }[] }>(`/api/menu-items/${id}/imagen`, { url }),
};
