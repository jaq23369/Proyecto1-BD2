"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Star, User, MapPin } from "lucide-react";
import { ordenesApi } from "@/lib/api/ordenes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { EstadoBadge, ESTADO_LABELS } from "@/components/ordenes/EstadoBadge";
import { OrdenTimeline } from "@/components/ordenes/OrdenTimeline";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Orden, EstadoOrden } from "@/types";

const NEXT_STATES: Record<EstadoOrden, EstadoOrden[]> = {
  creada:         ["confirmada", "cancelada"],
  confirmada:     ["en_preparacion", "cancelada"],
  en_preparacion: ["en_camino"],
  en_camino:      ["entregada"],
  entregada:      [],
  cancelada:      [],
};

export default function OrdenDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [orden, setOrden] = useState<Orden | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoModalOpen, setEstadoModalOpen] = useState(false);
  const [newEstado, setNewEstado] = useState<EstadoOrden>("confirmada");
  const [updatingEstado, setUpdatingEstado] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    ordenesApi.getById(id)
      .then((r) => setOrden(r.data))
      .catch(() => setOrden(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const canChangeEstado =
    orden && (isAdmin || orden.restaurante_id === user?.userId) &&
    NEXT_STATES[orden.estado_orden]?.length > 0;

  const isOwner = orden && user && orden.usuario_id === user.userId;
  const canReview = isOwner && orden?.estado_orden === "entregada";

  async function handleEstadoChange() {
    if (!id || !newEstado) return;
    setUpdatingEstado(true);
    try {
      await ordenesApi.updateEstado(id, newEstado, user?.nombre);
      const updated = await ordenesApi.getById(id);
      setOrden(updated.data);
      toast("Estado actualizado", "success");
      setEstadoModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar estado";
      toast(msg, "error");
    } finally {
      setUpdatingEstado(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!orden) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <EmptyState title="Orden no encontrada" description="La orden solicitada no existe." />
        </div>
      </PageWrapper>
    );
  }

  const nextStates = NEXT_STATES[orden.estado_orden] ?? [];

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Orden</p>
              <h1 className="text-xl font-bold font-mono text-gray-900">
                {orden.codigo_orden ?? orden._id.slice(-10).toUpperCase()}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <EstadoBadge estado={orden.estado_orden} />
                <span className="text-xs text-gray-400">{formatDate(orden.fecha_creacion)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canChangeEstado && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setNewEstado(nextStates[0]);
                    setEstadoModalOpen(true);
                  }}
                >
                  Cambiar estado
                </Button>
              )}
              {canReview && (
                <Link href={`/resenas/nueva?orden_id=${orden._id}`}>
                  <Button variant="primary" size="sm">
                    <Star size={13} />
                    Dejar resena
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Restaurant + User */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
            {orden.restaurante && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Restaurante</p>
                <Link href={`/restaurantes/${orden.restaurante_id}`} className="text-sm font-semibold text-amber-600 hover:underline">
                  {orden.restaurante.nombre}
                </Link>
              </div>
            )}
            {orden.usuario && (
              <div className="flex items-start gap-2">
                <User size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Cliente</p>
                  <p className="text-sm text-gray-700">{orden.usuario.nombre}</p>
                  <p className="text-xs text-gray-400">{orden.usuario.email}</p>
                </div>
              </div>
            )}
            {orden.direccion_entrega && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Entrega</p>
                  <p className="text-sm text-gray-700">{orden.direccion_entrega.direccion_texto}</p>
                </div>
              </div>
            )}
            {orden.notas_cliente && (
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Notas</p>
                <p className="text-sm text-gray-700">{orden.notas_cliente}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Items table */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 text-sm">Items del pedido</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Producto</th>
                      <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Cant.</th>
                      <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Precio</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orden.items.map((item, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800">{item.nombre_snapshot}</p>
                          {item.opciones_seleccionadas?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">{item.opciones_seleccionadas.join(", ")}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-gray-600">{item.cantidad}</td>
                        <td className="px-3 py-3 text-right text-gray-600">
                          {formatCurrency(item.precio_unitario_snapshot)}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen pago */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 text-sm mb-4">Resumen de pago</h2>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700">{formatCurrency(orden.resumen_pago?.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Costo de envio</span>
                  <span className="text-gray-700">{formatCurrency(orden.resumen_pago?.costo_envio ?? 0)}</span>
                </div>
                {(orden.resumen_pago?.descuento ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Descuento</span>
                    <span className="text-green-600">-{formatCurrency(orden.resumen_pago.descuento)}</span>
                  </div>
                )}
                <div className="pt-2.5 border-t border-gray-100 flex justify-between font-bold text-base">
                  <span className="text-gray-900">Total</span>
                  <span className="text-amber-600">{formatCurrency(orden.resumen_pago?.total ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-500">Metodo de pago</span>
                  <span className="text-gray-700 capitalize">{orden.resumen_pago?.metodo_pago ?? "-"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Estado de pago</span>
                  <span className="text-gray-700 capitalize">{orden.resumen_pago?.estado_pago ?? "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Historial de estados</h2>
            <OrdenTimeline historial={orden.historial_estados} />
          </div>
        </div>
      </div>

      {/* Estado change modal */}
      <Modal
        isOpen={estadoModalOpen}
        onClose={() => setEstadoModalOpen(false)}
        title="Cambiar estado de orden"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Estado actual: <EstadoBadge estado={orden.estado_orden} />
          </p>
          <Select
            label="Nuevo estado"
            options={nextStates.map((s) => ({ value: s, label: ESTADO_LABELS[s] }))}
            value={newEstado}
            onChange={(e) => setNewEstado(e.target.value as EstadoOrden)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setEstadoModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" isLoading={updatingEstado} onClick={handleEstadoChange}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
