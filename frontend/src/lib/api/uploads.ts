import { api, BASE_URL } from "./client";
import type { UploadedFile, PaginatedResponse, SingleResponse } from "@/types";

export const uploadsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return api.get<PaginatedResponse<UploadedFile>>(`/api/uploads${qs}`);
  },
  upload: (file: File, meta?: { descripcion?: string; tipo?: string; ref_id?: string }) => {
    const form = new FormData();
    form.append("file", file);
    if (meta?.descripcion) form.append("descripcion", meta.descripcion);
    if (meta?.tipo)        form.append("tipo", meta.tipo);
    if (meta?.ref_id)      form.append("ref_id", meta.ref_id);
    return api.post<SingleResponse<{ fileId: string; filename: string; size: number; url: string }>>("/api/uploads", form);
  },
  delete: (fileId: string) =>
    api.delete(`/api/uploads/${fileId}`),
  url: (fileId: string) => `${BASE_URL}/api/uploads/${fileId}`,
};
