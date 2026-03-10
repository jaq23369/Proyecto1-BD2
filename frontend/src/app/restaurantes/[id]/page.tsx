"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Edit, Star } from "lucide-react";
import { restaurantesApi } from "@/lib/api/restaurantes";
import { menuItemsApi } from "@/lib/api/menuItems";
import { resenasApi } from "@/lib/api/resenas";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Restaurante, MenuItem, Resena } from "@/types";

type ActiveTab = "menu" | "resenas";

export default function RestauranteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      restaurantesApi.getById(id),
      menuItemsApi.list({ restaurante_id: id, limit: "50" }),
    ])
      .then(([rRes, mRes]) => {
        setRestaurante(rRes.data);
        setMenuItems(mRes.data);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === "resenas" && id) {
      resenasApi.list({ restaurante_id: id, limit: "50" }).then((r) => setResenas(r.data)).catch(() => {});
    }
  }, [activeTab, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!restaurante) {
    return (
      <PageWrapper>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <EmptyState title="Restaurante no encontrado" description="El restaurante solicitado no existe o fue eliminado." />
        </div>
      </PageWrapper>
    );
  }

  const { nombre, categoria_principal, estado, estadisticas, ubicacion, contacto, horarios } = restaurante;

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={estado === "activo" ? "green" : "red"}>{estado}</Badge>
                <Badge variant="gray">{categoria_principal}</Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{nombre}</h1>
              <div className="flex items-center gap-2">
                <StarRating value={estadisticas?.rating_promedio ?? 0} size="md" />
                <span className="text-sm font-semibold text-amber-600">
                  {(estadisticas?.rating_promedio ?? 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">
                  ({estadisticas?.total_resenas ?? 0} resenas)
                </span>
                <span className="text-gray-200">|</span>
                <span className="text-sm text-gray-400">
                  {estadisticas?.total_ordenes ?? 0} ordenes
                </span>
              </div>
            </div>
            {isAdmin && (
              <Link href={`/restaurantes/${id}/editar`}>
                <Button variant="secondary" size="sm">
                  <Edit size={14} />
                  Editar
                </Button>
              </Link>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-gray-100">
            {ubicacion?.direccion_texto && (
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Direccion</p>
                  <p className="text-sm text-gray-700">{ubicacion.direccion_texto}</p>
                </div>
              </div>
            )}
            {contacto?.telefono && (
              <div className="flex items-start gap-2">
                <Phone size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Telefono</p>
                  <p className="text-sm text-gray-700">{contacto.telefono}</p>
                </div>
              </div>
            )}
            {contacto?.email && (
              <div className="flex items-start gap-2">
                <Mail size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Email</p>
                  <p className="text-sm text-gray-700">{contacto.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Horarios */}
          {horarios && horarios.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 mb-3">
                <Clock size={14} className="text-gray-400" />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Horarios</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {horarios.map((h) => (
                  <span key={h.dia} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-gray-700">
                    <span className="font-medium capitalize">{h.dia}</span>: {h.apertura} - {h.cierre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
          {(["menu", "resenas"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? "bg-white text-amber-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "menu" ? "Menu" : "Resenas"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "menu" && (
          <div>
            {menuItems.length === 0 ? (
              <EmptyState title="Sin items" description="Este restaurante no tiene items en su menu." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map((item) => (
                  <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.nombre}</h3>
                      <Badge variant={item.disponible ? "green" : "red"} className="shrink-0">
                        {item.disponible ? "Disponible" : "No disponible"}
                      </Badge>
                    </div>
                    {item.descripcion && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.descripcion}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="gray">{item.categoria}</Badge>
                      <span className="text-sm font-bold text-amber-600">
                        {formatCurrency(item.precio, item.moneda)}
                      </span>
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "resenas" && (
          <div>
            {resenas.length === 0 ? (
              <EmptyState title="Sin resenas" description="Este restaurante aun no tiene resenas." />
            ) : (
              <div className="space-y-4">
                {resenas.map((r) => (
                  <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating value={r.calificacion} size="sm" />
                          <span className="text-sm font-semibold text-amber-600">{r.calificacion}/5</span>
                        </div>
                        <p className="text-xs text-gray-400">{r.usuario?.nombre ?? "Usuario"} · {formatDate(r.fecha_creacion)}</p>
                      </div>
                    </div>
                    {r.comentario && (
                      <p className="text-sm text-gray-700 mb-3">{r.comentario}</p>
                    )}
                    {r.aspectos && (
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Star size={11} className="text-amber-400" />
                          Sabor: {r.aspectos.sabor}/5
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Star size={11} className="text-amber-400" />
                          Tiempo: {r.aspectos.tiempo_entrega}/5
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Star size={11} className="text-amber-400" />
                          Presentacion: {r.aspectos.presentacion}/5
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
