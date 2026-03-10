import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cardVariants, cn } from "@/lib/utils";
import { BASE_URL } from "@/lib/api/client";
import type { Restaurante } from "@/types";

interface RestauranteCardProps {
  restaurante: Restaurante;
}

// Neutral, refined palette — no orange
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pizza:    { bg: "bg-rose-100",   text: "text-rose-700",   dot: "bg-rose-400" },
  sushi:    { bg: "bg-sky-100",    text: "text-sky-700",    dot: "bg-sky-400" },
  burgers:  { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-400" },
  mexican:  { bg: "bg-teal-100",   text: "text-teal-700",   dot: "bg-teal-400" },
  italian:  { bg: "bg-rose-100",   text: "text-rose-800",   dot: "bg-rose-500" },
  chinese:  { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-400" },
  indian:   { bg: "bg-amber-100",  text: "text-amber-800",  dot: "bg-amber-500" },
  default:  { bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400" },
};

const CATEGORY_BG_GRADIENT: Record<string, string> = {
  pizza:   "from-rose-400 to-rose-600",
  sushi:   "from-sky-400 to-sky-600",
  burgers: "from-amber-400 to-amber-600",
  mexican: "from-teal-400 to-teal-600",
  italian: "from-rose-500 to-pink-600",
  chinese: "from-red-400 to-red-600",
  indian:  "from-amber-500 to-amber-700",
  default: "from-slate-500 to-slate-700",
};

function getCategory(categoria: string) {
  const key = Object.keys(CATEGORY_COLORS).find((k) =>
    categoria?.toLowerCase().includes(k)
  ) ?? "default";
  return { colors: CATEGORY_COLORS[key], gradient: CATEGORY_BG_GRADIENT[key] };
}

/** Resolve relative image URLs to absolute backend URL */
function resolveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url}`;
}

export function RestauranteCard({ restaurante }: RestauranteCardProps) {
  const { _id, nombre, categoria_principal, estado, estadisticas, ubicacion, distancia_m } = restaurante;
  const { colors, gradient } = getCategory(categoria_principal);
  const imageUrl = resolveImageUrl(restaurante.imagen_url);

  const rating = estadisticas?.rating_promedio ?? 0;
  const totalResenas = estadisticas?.total_resenas ?? 0;
  const totalOrdenes = estadisticas?.total_ordenes ?? 0;

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -4 }} transition={{ duration: 0.25, ease: "easeOut" }} className="h-full">
      <Link href={`/restaurantes/${_id}`} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl">
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-soft overflow-hidden h-full hover:shadow-float hover:border-slate-300/60 transition-all duration-300 group flex flex-col">

          {/* Image header */}
          <div className={cn(
            "h-40 relative overflow-hidden",
            !imageUrl && `bg-gradient-to-br ${gradient}`
          )}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={nombre}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white/30 text-5xl font-black select-none group-hover:scale-110 transition-transform duration-500">
                  {nombre.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            {/* Bottom fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {/* Estado badge */}
            <div className="absolute bottom-3 left-3">
              <Badge variant={estado === "activo" ? "green" : "red"} className="shadow-sm bg-white/90 backdrop-blur-sm">
                {estado}
              </Badge>
            </div>
            {/* Rating chip top-right */}
            {rating > 0 && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white rounded-lg px-2 py-1">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex flex-col gap-2 flex-1">
            {/* Name + category */}
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-[15px] leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors duration-150">
                {nombre}
              </h3>
              {categoria_principal && (
                <span className={cn("inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                  {categoria_principal}
                </span>
              )}
            </div>

            {/* Bottom stats */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <ShoppingBag size={12} />
                {totalOrdenes} pedidos
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                {rating.toFixed(1)}
                <span className="text-slate-300 ml-0.5">({totalResenas})</span>
              </span>
            </div>

            {/* Address */}
            {ubicacion?.direccion_texto && (
              <p className="flex items-start gap-1.5 text-xs text-slate-400 line-clamp-1">
                <MapPin size={11} className="shrink-0 mt-0.5 text-slate-300" />
                {ubicacion.direccion_texto}
              </p>
            )}

            {distancia_m != null && (
              <span className="flex items-center gap-1 text-xs font-bold text-teal-600">
                <MapPin size={11} />
                {(distancia_m / 1000).toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
