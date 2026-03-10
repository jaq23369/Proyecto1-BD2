"use client";
import { useState, useEffect, useCallback } from "react";
import { BarChart2 } from "lucide-react";
import { analyticsApi } from "@/lib/api/analytics";
import { useAuth } from "@/context/AuthContext";
import { BarChart } from "@/components/analytics/BarChart";
import { StarRating } from "@/components/ui/StarRating";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PageWrapper } from "@/components/layout/PageWrapper";

function SkeletonPanel() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="flex-1 h-6 bg-gray-200 rounded-full" />
            <div className="h-3 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { isAdmin } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [ventas, setVentas] = useState<{ anio_mes: string; total_ventas: number; restaurante_nombre: string }[]>([]);
  const [topProductos, setTopProductos] = useState<{ nombre_producto: string; unidades_vendidas: number; restaurante_nombre: string }[]>([]);
  const [ratings, setRatings] = useState<{ restaurante_nombre: string; rating_promedio: number; total_resenas: number; promedio_sabor: number; promedio_tiempo_entrega: number; promedio_presentacion: number }[]>([]);
  const [funnel, setFunnel] = useState<{ estado_orden: string; total: number; porcentaje: number }[]>([]);
  const [tiempos, setTiempos] = useState<{ restaurante_nombre: string; ordenes_analizadas: number; prom_creada_confirmada: number; prom_confirmada_preparacion: number; prom_preparacion_camino: number; prom_camino_entregada: number }[]>([]);

  const fetchAll = useCallback(async (params?: Record<string, string>) => {
    setIsLoading(true);
    try {
      const [v, tp, r, f, t] = await Promise.all([
        analyticsApi.ventasPorMes(params),
        analyticsApi.topProductos(params),
        analyticsApi.ratings(params),
        analyticsApi.funnelOrdenes(params),
        analyticsApi.tiemposEstado(params),
      ]);
      setVentas(v.data ?? []);
      setTopProductos(tp.data ?? []);
      setRatings(r.data ?? []);
      setFunnel(f.data ?? []);
      setTiempos(t.data ?? []);
    } catch {
      // partial failures are fine — data stays empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function handleFilter() {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    fetchAll(params);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
            <BarChart2 size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-400">Panel de analisis del sistema</p>
          </div>
        </div>

        {/* Date filter */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap gap-3 items-end">
          <div className="w-44">
            <Input
              label="Desde"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Input
              label="Hasta"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button variant="primary" size="md" onClick={handleFilter}>
            Aplicar filtros
          </Button>
          <Button variant="ghost" size="md" onClick={() => { setStartDate(""); setEndDate(""); fetchAll(); }}>
            Limpiar
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => <SkeletonPanel key={i} />)}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Row 1: Ventas + Top Productos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <BarChart
                title="Ventas por Mes"
                items={ventas.slice(0, 10).map((v) => ({
                  label: v.anio_mes,
                  value: v.total_ventas,
                  sublabel: v.restaurante_nombre,
                }))}
              />
              <BarChart
                title="Top Productos"
                items={topProductos.slice(0, 10).map((p) => ({
                  label: p.nombre_producto,
                  value: p.unidades_vendidas,
                  sublabel: p.restaurante_nombre,
                }))}
              />
            </div>

            {/* Row 2: Funnel */}
            <BarChart
              title="Funnel de Ordenes"
              items={funnel.map((f) => ({
                label: f.estado_orden,
                value: f.total,
                sublabel: `${f.porcentaje?.toFixed(1) ?? 0}%`,
              }))}
              className="w-full"
            />

            {/* Row 3: Ratings table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Ratings de Restaurantes</h3>
              </div>
              {ratings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Restaurante</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Resenas</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Sabor</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Tiempo</th>
                        <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Presentacion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratings.map((r, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-gray-800">{r.restaurante_nombre}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <StarRating value={Math.round(r.rating_promedio)} size="sm" />
                              <span className="text-xs text-amber-600 font-semibold">{r.rating_promedio?.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">{r.total_resenas}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{r.promedio_sabor?.toFixed(1)}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{r.promedio_tiempo_entrega?.toFixed(1)}</td>
                          <td className="px-5 py-3 text-center text-gray-600">{r.promedio_presentacion?.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Row 4: Tiempos por estado */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Tiempos por Estado (minutos promedio)</h3>
              </div>
              {tiempos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Restaurante</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ordenes</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Creada-Conf.</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Conf.-Prep.</th>
                        <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Prep.-Camino</th>
                        <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Camino-Entrega</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiempos.map((t, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="px-5 py-3 font-medium text-gray-800">{t.restaurante_nombre}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{t.ordenes_analizadas}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{t.prom_creada_confirmada?.toFixed(0) ?? "-"}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{t.prom_confirmada_preparacion?.toFixed(0) ?? "-"}</td>
                          <td className="px-3 py-3 text-center text-gray-600">{t.prom_preparacion_camino?.toFixed(0) ?? "-"}</td>
                          <td className="px-5 py-3 text-center text-gray-600">{t.prom_camino_entregada?.toFixed(0) ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
