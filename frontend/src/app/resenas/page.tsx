"use client";
import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { resenasApi } from "@/lib/api/resenas";
import { restaurantesApi } from "@/lib/api/restaurantes";
import { StarRating } from "@/components/ui/StarRating";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate } from "@/lib/utils";
import type { Resena, Restaurante } from "@/types";

const LIMIT = 12;

export default function ResenasPage() {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [restauranteId, setRestauranteId] = useState("");
  const [calificacionMin, setCalificacionMin] = useState(0);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);

  useEffect(() => {
    restaurantesApi.list({ limit: "200" }).then((r) => setRestaurantes(r.data)).catch(() => {});
  }, []);

  const fetchResenas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (restauranteId) params.restaurante_id = restauranteId;
      if (calificacionMin > 0) params.calificacion_min = String(calificacionMin);
      const res = await resenasApi.list(params);
      setResenas(res.data);
      setTotal(res.meta.total);
    } catch {
      setResenas([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, restauranteId, calificacionMin]);

  useEffect(() => { fetchResenas(); }, [fetchResenas]);

  const restauranteOptions = [
    { value: "", label: "Todos los restaurantes" },
    ...restaurantes.map((r) => ({ value: r._id, label: r.nombre })),
  ];

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
            <Star size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resenas</h1>
            <p className="text-sm text-gray-400">Opiniones de clientes sobre los restaurantes</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="w-60">
            <Select
              options={restauranteOptions}
              value={restauranteId}
              onChange={(e) => { setRestauranteId(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <span className="text-sm text-gray-500">Min:</span>
            <StarRating
              value={calificacionMin}
              onChange={(v) => { setCalificacionMin(calificacionMin === v ? 0 : v); setPage(1); }}
              size="sm"
            />
            {calificacionMin > 0 && (
              <button
                onClick={() => { setCalificacionMin(0); setPage(1); }}
                className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                x
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : resenas.length === 0 ? (
          <EmptyState title="Sin resenas" description="No se encontraron resenas con los filtros aplicados." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resenas.map((r) => (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                {/* Rating + user */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating value={r.calificacion} size="sm" />
                      <span className="text-xs font-semibold text-amber-600">{r.calificacion}/5</span>
                    </div>
                    <p className="text-xs text-gray-400">{r.usuario?.nombre ?? "Usuario"}</p>
                    <p className="text-xs text-gray-300">{formatDate(r.fecha_creacion)}</p>
                  </div>
                </div>

                {/* Comentario */}
                {r.comentario && (
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{r.comentario}</p>
                )}

                {/* Aspectos */}
                {r.aspectos && (
                  <div className="flex flex-col gap-1 pt-3 border-t border-gray-100">
                    {[
                      { label: "Sabor", val: r.aspectos.sabor },
                      { label: "Tiempo", val: r.aspectos.tiempo_entrega },
                      { label: "Presentacion", val: r.aspectos.presentacion },
                    ].map((a) => (
                      <div key={a.label} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{a.label}</span>
                        <div className="flex items-center gap-1.5">
                          <StarRating value={a.val} size="sm" />
                          <span className="text-xs text-gray-500">{a.val}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
