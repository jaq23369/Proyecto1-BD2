"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { resenasApi } from "@/lib/api/resenas";
import { ordenesApi } from "@/lib/api/ordenes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { StarRating } from "@/components/ui/StarRating";
import { AspectosRating } from "@/components/resenas/AspectosRating";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatDate } from "@/lib/utils";
import type { Orden } from "@/types";

function NuevaResenaForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledOrdenId = searchParams.get("orden_id") ?? "";

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [ordenId, setOrdenId] = useState(prefilledOrdenId);
  const [calificacion, setCalificacion] = useState(5);
  const [aspectos, setAspectos] = useState({
    sabor: 5,
    tiempo_entrega: 5,
    presentacion: 5,
  });
  const [comentario, setComentario] = useState("");
  const [isLoadingOrdenes, setIsLoadingOrdenes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setIsLoadingOrdenes(true);
    ordenesApi
      .list({ usuario_id: user.userId, estado_orden: "entregada", limit: "50" })
      .then((r) => setOrdenes(r.data))
      .catch(() => {})
      .finally(() => setIsLoadingOrdenes(false));
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast("Inicia sesion para continuar", "error");
      return;
    }
    if (!ordenId) {
      toast("Selecciona una orden", "error");
      return;
    }
    if (calificacion < 1) {
      toast("Selecciona una calificacion", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await resenasApi.create({
        orden_id: ordenId,
        usuario_id: user.userId,
        calificacion,
        comentario: comentario.trim() || undefined,
        aspectos,
      });
      toast("Resena publicada exitosamente", "success");
      router.push("/resenas");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al publicar resena";
      toast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const ordenOptions = ordenes.map((o) => ({
    value: o._id,
    label: `${o.codigo_orden ?? o._id.slice(-8).toUpperCase()} — ${
      o.restaurante?.nombre ?? "Restaurante"
    } — ${formatDate(o.fecha_creacion)}`,
  }));

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
            <Star size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Resena</h1>
            <p className="text-sm text-gray-400">Comparte tu experiencia</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6"
        >
          {/* Order select */}
          {isLoadingOrdenes ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Spinner size="sm" />
              Cargando ordenes...
            </div>
          ) : ordenes.length === 0 ? (
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
              No tienes ordenes entregadas disponibles para resenar.
            </div>
          ) : (
            <Select
              label="Orden entregada"
              options={ordenOptions}
              placeholder="Selecciona una orden..."
              value={ordenId}
              onChange={(e) => setOrdenId(e.target.value)}
            />
          )}

          {/* Calificacion general */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Calificacion general
            </label>
            <div className="flex items-center gap-3">
              <StarRating
                value={calificacion}
                onChange={setCalificacion}
                size="md"
              />
              <span className="text-lg font-bold text-amber-600">
                {calificacion}/5
              </span>
            </div>
          </div>

          {/* Aspectos */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Aspectos</label>
            <div className="bg-gray-50 rounded-xl p-4">
              <AspectosRating value={aspectos} onChange={setAspectos} />
            </div>
          </div>

          {/* Comentario */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Comentario{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Cuenta tu experiencia con el restaurante..."
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 hover:border-gray-300 transition-all resize-none"
            />
            <p className="text-xs text-gray-400 text-right">
              {comentario.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={!ordenId || calificacion < 1}
            >
              Publicar resena
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}

export default function NuevaResenaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      }
    >
      <NuevaResenaForm />
    </Suspense>
  );
}
