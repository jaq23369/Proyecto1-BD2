import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { cardVariants, cn } from "@/lib/utils";
import type { Restaurante } from "@/types";

interface RestauranteCardProps {
  restaurante: Restaurante;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  pizza: "from-brand-400 to-rose-400",
  sushi: "from-blue-500 to-cyan-400",
  burgers: "from-amber-400 to-orange-500",
  mexican: "from-emerald-400 to-teal-500",
  italian: "from-rose-500 to-red-400",
  chinese: "from-red-500 to-yellow-500",
  indian: "from-orange-500 to-amber-600",
  default: "from-slate-700 to-slate-500",
};

function getGradient(categoria: string): string {
  const key = Object.keys(CATEGORY_GRADIENTS).find((k) =>
    categoria?.toLowerCase().includes(k)
  );
  return CATEGORY_GRADIENTS[key ?? "default"];
}

export function RestauranteCard({ restaurante }: RestauranteCardProps) {
  const {
    _id,
    nombre,
    categoria_principal,
    estado,
    estadisticas,
    ubicacion,
    distancia_m,
  } = restaurante;

  const gradient = getGradient(categoria_principal);

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -6 }} transition={{ duration: 0.3, ease: "easeOut" }} className="h-full">
      <Link href={`/restaurantes/${_id}`} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded-3xl">
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100/50 overflow-hidden h-full hover:shadow-float transition-all duration-300 group flex flex-col">
          {/* Image / gradient header */}
          <div
            className={cn(
              "h-40 bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
              !restaurante.imagen_url && gradient
            )}
          >
            {restaurante.imagen_url ? (
              <Image
                src={restaurante.imagen_url}
                alt={nombre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-black/10 mix-blend-overlay group-hover:bg-transparent transition-colors duration-500" />
                <span className="text-white text-4xl font-black tracking-tight opacity-40 select-none group-hover:scale-110 transition-transform duration-500">
                  {nombre.slice(0, 2).toUpperCase()}
                </span>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Badge variant={estado === "activo" ? "green" : "red"} className="shadow-sm backdrop-blur-md bg-white/90">
                {estado}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex flex-col gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-bold text-slate-900 text-lg leading-tight line-clamp-1 group-hover:text-brand-600 transition-colors">
                  {nombre}
                </h3>
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                {categoria_principal}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-50">
              <div className="flex items-center gap-1.5 bg-brand-50 px-2 py-1 rounded-lg">
                <Star size={12} className="text-brand-500 fill-brand-500" />
                <span className="text-sm text-brand-700 font-bold">
                  {(estadisticas?.rating_promedio ?? 0).toFixed(1)}
                </span>
              </div>
              <span className="text-xs font-medium text-slate-400">
                ({estadisticas?.total_resenas ?? 0} resenas)
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-1">
              <span className="flex items-center gap-1 mt-0.5">
                <ShoppingBag size={12} className="text-slate-400" />
                {estadisticas?.total_ordenes ?? 0} ordenes
              </span>
              {distancia_m != null && (
                <span className="flex items-center gap-1 text-emerald-600 font-bold mt-0.5">
                  <MapPin size={12} />
                  {(distancia_m / 1000).toFixed(1)}km
                </span>
              )}
            </div>

            {/* Address */}
            {ubicacion?.direccion_texto && (
              <p className="text-xs text-slate-400 flex items-start gap-1.5 mt-2 line-clamp-1">
                <MapPin size={13} className="shrink-0 text-slate-300" />
                {ubicacion.direccion_texto}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
