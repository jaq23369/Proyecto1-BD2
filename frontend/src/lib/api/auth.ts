import { api } from "./client";
import type { AuthUser, SingleResponse } from "@/types";

export const authApi = {
  register: (data: { nombre: string; email: string; password: string; tipo_usuario?: string }) =>
    api.post<SingleResponse<AuthUser>>("/api/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<SingleResponse<AuthUser>>("/api/auth/login", data),

  logout: () =>
    api.post<SingleResponse<{ message: string }>>("/api/auth/logout", {}),

  me: () =>
    api.get<SingleResponse<AuthUser>>("/api/auth/me"),
};
