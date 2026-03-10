"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Trash2 } from "lucide-react";
import { usuariosApi } from "@/lib/api/usuarios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate } from "@/lib/utils";
import type { Usuario } from "@/types";

export default function UsuariosPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ activos: 0, inactivos: 0 });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usuariosApi.list({ limit: "100" });
      setUsuarios(res.data);
    } catch {
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
    usuariosApi.statsCount().then((r) => setStats({ activos: r.data.activos, inactivos: r.data.inactivos })).catch(() => {});
  }, [fetchUsuarios]);

  async function handleDeleteInactive() {
    setIsDeleting(true);
    try {
      const res = await usuariosApi.deleteInactive();
      toast(`${res.data.deletedCount ?? 0} usuarios inactivos eliminados`, "success");
      setDeleteConfirmOpen(false);
      fetchUsuarios();
      usuariosApi.statsCount().then((r) => setStats({ activos: r.data.activos, inactivos: r.data.inactivos })).catch(() => {});
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al eliminar", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isAdmin) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Acceso restringido a administradores.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
              <Users size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
              <p className="text-sm text-gray-400">Gestiona los usuarios del sistema</p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={stats.inactivos === 0}
          >
            <Trash2 size={14} />
            Eliminar inactivos sin ordenes
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <span className="text-sm font-semibold text-green-700">{stats.activos} activos</span>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            <span className="text-sm font-semibold text-red-600">{stats.inactivos} inactivos</span>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : usuarios.length === 0 ? (
          <EmptyState title="Sin usuarios" description="No se encontraron usuarios." />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nombre</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u) => (
                    <tr key={u._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/usuarios/${u._id}`} className="font-medium text-gray-800 hover:text-amber-600 transition-colors">
                          {u.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={u.tipo_usuario === "admin" ? "purple" : "blue"}>
                          {u.tipo_usuario}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={u.estado === "activo" ? "green" : "red"}>
                          {u.estado}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-400 text-xs">
                        {formatDate(u.fecha_creacion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Eliminar usuarios inactivos" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Esto eliminara todos los usuarios con estado <span className="font-semibold">inactivo</span> que no tengan ordenes asociadas.
            Esta accion es irreversible.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="danger" size="sm" isLoading={isDeleting} onClick={handleDeleteInactive}>
              Eliminar inactivos
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
