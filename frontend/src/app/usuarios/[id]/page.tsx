"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2, User, MapPin } from "lucide-react";
import { usuariosApi } from "@/lib/api/usuarios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate } from "@/lib/utils";
import type { Usuario, Direccion } from "@/types";

export default function UsuarioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, user: authUser } = useAuth();
  const { toast } = useToast();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [addDireccionOpen, setAddDireccionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const [formTelefono, setFormTelefono] = useState("");
  const [formNotificaciones, setFormNotificaciones] = useState(true);

  // Add direccion form
  const [newAlias, setNewAlias] = useState("");
  const [newDireccionTexto, setNewDireccionTexto] = useState("");

  const canEdit = isAdmin || authUser?.userId === id;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    usuariosApi.getById(id)
      .then((r) => setUsuario(r.data))
      .catch(() => setUsuario(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  function openEdit() {
    if (!usuario) return;
    setFormTelefono(usuario.telefono ?? "");
    setFormNotificaciones(usuario.preferencias?.notificaciones ?? true);
    setEditOpen(true);
  }

  async function handleEditSave() {
    if (!usuario) return;
    setSubmitting(true);
    try {
      await usuariosApi.update(usuario._id, {
        telefono: formTelefono,
        preferencias: { ...usuario.preferencias, notificaciones: formNotificaciones },
      });
      setUsuario((prev) =>
        prev
          ? { ...prev, telefono: formTelefono, preferencias: { ...prev.preferencias, notificaciones: formNotificaciones } }
          : prev
      );
      toast("Perfil actualizado", "success");
      setEditOpen(false);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddDireccion() {
    if (!usuario || !newAlias || !newDireccionTexto) {
      toast("Completa todos los campos", "error"); return;
    }
    setSubmitting(true);
    try {
      await usuariosApi.addDireccion(usuario._id, {
        alias: newAlias,
        direccion_texto: newDireccionTexto,
      });
      const updated = await usuariosApi.getById(usuario._id);
      setUsuario(updated.data);
      toast("Direccion agregada", "success");
      setAddDireccionOpen(false);
      setNewAlias("");
      setNewDireccionTexto("");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al agregar", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveDireccion(alias: string) {
    if (!usuario) return;
    try {
      await usuariosApi.removeDireccion(usuario._id, alias);
      const updated = await usuariosApi.getById(usuario._id);
      setUsuario(updated.data);
      toast("Direccion eliminada", "success");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al eliminar", "error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <EmptyState title="Usuario no encontrado" description="El usuario solicitado no existe." />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 shrink-0">
                <User size={24} className="text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{usuario.nombre}</h1>
                <p className="text-sm text-gray-500">{usuario.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={usuario.tipo_usuario === "admin" ? "purple" : "blue"}>
                    {usuario.tipo_usuario}
                  </Badge>
                  <Badge variant={usuario.estado === "activo" ? "green" : "red"}>
                    {usuario.estado}
                  </Badge>
                </div>
              </div>
            </div>
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={openEdit}>
                Editar perfil
              </Button>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Telefono</p>
              <p className="text-sm text-gray-700">{usuario.telefono || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Idioma</p>
              <p className="text-sm text-gray-700">{usuario.preferencias?.idioma || "es"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Notificaciones</p>
              <Badge variant={usuario.preferencias?.notificaciones ? "green" : "gray"}>
                {usuario.preferencias?.notificaciones ? "Activas" : "Desactivadas"}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Registro</p>
              <p className="text-sm text-gray-700">{formatDate(usuario.fecha_creacion)}</p>
            </div>
          </div>
        </div>

        {/* Direccion principal */}
        {usuario.direccion_principal && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-amber-500" />
              <p className="text-sm font-semibold text-amber-800">Direccion principal</p>
            </div>
            <p className="text-sm text-amber-900 font-medium">{usuario.direccion_principal.alias}</p>
            <p className="text-sm text-amber-700">{usuario.direccion_principal.direccion_texto}</p>
          </div>
        )}

        {/* Direcciones */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 text-sm">Mis Direcciones ({usuario.direcciones?.length ?? 0})</h2>
            {canEdit && (
              <Button variant="primary" size="sm" onClick={() => setAddDireccionOpen(true)}>
                <Plus size={13} />
                Agregar
              </Button>
            )}
          </div>

          {(!usuario.direcciones || usuario.direcciones.length === 0) ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin direcciones registradas.</p>
          ) : (
            <div className="space-y-2">
              {usuario.direcciones.map((d) => (
                <div key={d.alias} className="flex items-center justify-between gap-3 p-3 border border-gray-100 rounded-xl">
                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.alias}</p>
                      <p className="text-xs text-gray-500">{d.direccion_texto}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleRemoveDireccion(d.alias)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar perfil" size="sm">
        <div className="space-y-4">
          <Input
            label="Telefono"
            type="tel"
            value={formTelefono}
            onChange={(e) => setFormTelefono(e.target.value)}
            placeholder="+502 1234 5678"
          />
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notif-check"
              checked={formNotificaciones}
              onChange={(e) => setFormNotificaciones(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-300 cursor-pointer"
            />
            <label htmlFor="notif-check" className="text-sm font-medium text-gray-700 cursor-pointer">
              Recibir notificaciones
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" isLoading={submitting} onClick={handleEditSave}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Add direccion modal */}
      <Modal isOpen={addDireccionOpen} onClose={() => setAddDireccionOpen(false)} title="Agregar direccion" size="sm">
        <div className="space-y-4">
          <Input
            label="Alias"
            placeholder="Casa, Trabajo, etc."
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
          />
          <Input
            label="Direccion"
            placeholder="Calle, ciudad, pais"
            value={newDireccionTexto}
            onChange={(e) => setNewDireccionTexto(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setAddDireccionOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" isLoading={submitting} onClick={handleAddDireccion}>Agregar</Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
