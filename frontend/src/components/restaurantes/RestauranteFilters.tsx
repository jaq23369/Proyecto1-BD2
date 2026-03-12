"use client";
import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FilterParams {
  q?: string;
  categoria?: string;
  estado?: string;
  lat?: string;
  lng?: string;
  maxKm?: string;
  page?: string;
}

interface RestauranteFiltersProps {
  categorias: string[];
  onFilterChange: (params: FilterParams) => void;
  className?: string;
}

export function RestauranteFilters({
  categorias,
  onFilterChange,
  className,
}: RestauranteFiltersProps) {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [maxKm, setMaxKm] = useState("");
  const [geoOpen, setGeoOpen] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fireChange({ q, categoria, estado, lat, lng, maxKm });
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function fireChange(params: FilterParams) {
    const clean: FilterParams = {};
    if (params.q?.trim()) clean.q = params.q.trim();
    if (params.categoria) clean.categoria = params.categoria;
    if (params.estado) clean.estado = params.estado;
    if (params.lat && params.lng) {
      clean.lat = params.lat;
      clean.lng = params.lng;
      if (params.maxKm) clean.maxKm = params.maxKm;
    }
    clean.page = "1";
    onFilterChange(clean);
  }

  function handleSelectChange(
    field: "categoria" | "estado",
    value: string
  ) {
    const updated = { q, categoria, estado, lat, lng, maxKm, [field]: value };
    if (field === "categoria") setCategoria(value);
    if (field === "estado") setEstado(value);
    fireChange(updated);
  }

  function handleGeoSearch() {
    fireChange({ q, categoria, estado, lat, lng, maxKm });
  }

  function clearGeo() {
    setLat("");
    setLng("");
    setMaxKm("");
    fireChange({ q, categoria, estado, lat: "", lng: "", maxKm: "" });
  }

  const categoriaOptions = [
    { value: "", label: "Todas las categorias" },
    ...categorias.map((c) => ({ value: c, label: c })),
  ];

  const estadoOptions = [
    { value: "", label: "Todos los estados" },
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search size={16} className="text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, categoría o platos..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-soft border-transparent ring-1 ring-slate-200/50 hover:ring-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all duration-300"
          />
          {q && (
            <button
              type="button"
              onClick={() => { setQ(""); fireChange({ q: "", categoria, estado, lat, lng, maxKm }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category */}
        <div className="w-full sm:w-52">
          <Select
            options={categoriaOptions}
            value={categoria}
            onChange={(e) => handleSelectChange("categoria", e.target.value)}
          />
        </div>

        {/* Estado */}
        <div className="w-full sm:w-44">
          <Select
            options={estadoOptions}
            value={estado}
            onChange={(e) => handleSelectChange("estado", e.target.value)}
          />
        </div>

        {/* Geo toggle */}
        <Button
          variant={geoOpen ? "primary" : "secondary"}
          size="md"
          onClick={() => setGeoOpen((v) => !v)}
          className="shrink-0"
        >
          <MapPin size={14} />
          Cercanos
        </Button>
      </div>

      {/* Geo panel */}
      {geoOpen && (
        <div className="flex flex-wrap gap-3 items-end bg-white/50 backdrop-blur-md shadow-soft border border-slate-100 rounded-2xl p-5 mt-2 transition-all">
          <div className="w-40">
            <Input
              label="Latitud"
              type="number"
              placeholder="-14.0938"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Input
              label="Longitud"
              type="number"
              placeholder="-75.0038"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </div>
          <div className="w-28">
            <Input
              label="Max km"
              type="number"
              placeholder="5"
              value={maxKm}
              onChange={(e) => setMaxKm(e.target.value)}
            />
          </div>
          <Button variant="primary" size="md" onClick={handleGeoSearch}>
            Buscar
          </Button>
          <Button variant="ghost" size="md" onClick={clearGeo}>
            Limpiar
          </Button>
        </div>
      )}
    </div>
  );
}
