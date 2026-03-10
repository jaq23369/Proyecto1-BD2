"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag, Plus } from "lucide-react";
import { ordenesApi } from "@/lib/api/ordenes";
import { useAuth } from "@/context/AuthContext";
import { EstadoBadge } from "@/components/ordenes/EstadoBadge";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Orden, EstadoOrden } from "@/types";

const LIMIT = 15;

const ESTADO_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "creada", label: "Creada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "en_preparacion", label: "En preparacion" },
  { value: "en_camino", label: "En camino" },
  { value: "entregada", label: "Entregada" },
  { value: "cancelada", label: "Cancelada" },
];

export default function OrdenesPage() {
  const { user, isAdmin } = useAuth();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [stats, setStats] = useState({ total: 0, entregadas: 0, canceladas: 0 });

  useEffect(() => {
    ordenesApi.statsCount().then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const fetchOrdenes = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(LIMIT),
      };
      if (!isAdmin) params.usuario_id = user.userId;
      if (estadoFilter) params.estado_orden = estadoFilter;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      const res = await ordenesApi.list(params);
      setOrdenes(res.data);
      setTotal(res.meta.total);
    } catch {
      setOrdenes([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, page, estadoFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
              <ShoppingBag size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAdmin ? "Todas las Ordenes" : "Mis Ordenes"}
              </h1>
              <p className="text-sm text-gray-400">Gestiona y sigue el estado de tus pedidos</p>
            </div>
          </div>
          <Link href="/ordenes/nueva">
            <Button variant="primary" size="md">
              <Plus size={15} />
              Nueva orden
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">Total</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-700">{stats.entregadas}</p>
            <p className="text-xs text-green-500 mt-1">Entregadas</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-red-600">{stats.canceladas}</p>
            <p className="text-xs text-red-400 mt-1">Canceladas</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="w-48">
            <Select
              options={ESTADO_OPTIONS}
              value={estadoFilter}
              onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }}
              placeholder="Todos los estados"
            />
          </div>
          <div className="w-44">
            <Input
              type="date"
              placeholder="Desde"
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-44">
            <Input
              type="date"
              placeholder="Hasta"
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : ordenes.length === 0 ? (
          <EmptyState
            title="Sin ordenes"
            description="No se encontraron ordenes con los filtros aplicados."
          />
        ) : (
          <div className="space-y-3">
            {ordenes.map((orden) => (
              <Link key={orden._id} href={`/ordenes/${orden._id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200 hover:border-amber-100 cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-800">
                          {orden.codigo_orden ?? orden._id.slice(-8).toUpperCase()}
                        </span>
                        <EstadoBadge estado={orden.estado_orden} />
                      </div>
                      {orden.restaurante && (
                        <p className="text-sm text-gray-600 truncate">{orden.restaurante.nombre}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(orden.fecha_creacion)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-amber-600">
                        {formatCurrency(orden.resumen_pago?.total ?? 0)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {orden.items?.length ?? 0} item{(orden.items?.length ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      </div>
    </PageWrapper>
  );
}
