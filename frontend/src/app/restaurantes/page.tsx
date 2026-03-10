"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { restaurantesApi } from "@/lib/api/restaurantes";
import { RestauranteCard } from "@/components/restaurantes/RestauranteCard";
import { RestauranteFilters } from "@/components/restaurantes/RestauranteFilters";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { listVariants, cardVariants } from "@/lib/utils";
import type { Restaurante } from "@/types";

const LIMIT = 12;

interface FilterParams {
  q?: string;
  categoria?: string;
  estado?: string;
  lat?: string;
  lng?: string;
  maxKm?: string;
  page?: string;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function RestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({});
  const [categorias, setCategorias] = useState<string[]>([]);
  const [stats, setStats] = useState({ activos: 0, inactivos: 0 });

  useEffect(() => {
    restaurantesApi.statsCategorias().then((r) => setCategorias(r.data)).catch(() => { });
    restaurantesApi.statsCount().then((r) => setStats({ activos: r.data.activos, inactivos: r.data.inactivos })).catch(() => { });
  }, []);

  const fetchRestaurantes = useCallback(async (params: FilterParams, p: number) => {
    setIsLoading(true);
    try {
      const query: Record<string, string> = {
        page: String(p),
        limit: String(LIMIT),
      };
      if (params.q) query.q = params.q;
      if (params.categoria) query.categoria = params.categoria;
      if (params.estado) query.estado = params.estado;
      if (params.lat && params.lng) {
        query.lat = params.lat;
        query.lng = params.lng;
        if (params.maxKm) query.maxKm = params.maxKm;
      }
      const res = await restaurantesApi.list(query);
      setRestaurantes(res.data);
      setTotal(res.meta.total);
    } catch {
      setRestaurantes([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurantes(filters, page);
  }, [filters, page, fetchRestaurantes]);

  function handleFilterChange(params: FilterParams) {
    setFilters(params);
    setPage(1);
  }

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 bg-white p-6 rounded-[2rem] shadow-soft border border-slate-100">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/20">
            <UtensilsCrossed size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-black tracking-tight text-slate-900">Restaurantes</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Explora las mejores opciones cerca de ti</p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 mb-6 px-2">
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-100 rounded-2xl px-5 py-2.5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-emerald-700">{stats.activos} activos</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-sm font-bold text-slate-600">{stats.inactivos} inactivos</span>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <RestauranteFilters
            categorias={categorias}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : restaurantes.length === 0 ? (
          <EmptyState
            title="Sin restaurantes"
            description="No se encontraron restaurantes con los filtros aplicados."
          />
        ) : (
          <motion.ul
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 list-none"
          >
            {restaurantes.map((r) => (
              <motion.li key={r._id} variants={cardVariants}>
                <RestauranteCard restaurante={r} />
              </motion.li>
            ))}
          </motion.ul>
        )}

        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          onPageChange={handlePageChange}
        />
      </div>
    </PageWrapper>
  );
}
