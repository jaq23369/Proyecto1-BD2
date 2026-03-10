"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Edit } from "lucide-react";
import { restaurantesApi } from "@/lib/api/restaurantes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import type { Restaurante } from "@/types";

const ESTADO_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

export default function EditarRestaurantePage() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaPrincipal, setCategoriaPrincipal] = useState("");
  const [estado, setEstado] = useState<"activo" | "inactivo">("activo");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccionTexto, setDireccionTexto] = useState("");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    restaurantesApi.getById(id)
      .then((r) => {
        const data = r.data;
        setRestaurante(data);
        setNombre(data.nombre ?? "");
        setDescripcion(data.descripcion ?? "");
        setCategoriaPrincipal(data.categoria_principal ?? "");
        setEstado(data.estado ?? "activo");
        setTelefono(data.contacto?.telefono ?? "");
        setEmail(data.contacto?.email ?? "");
        setDireccionTexto(data.ubicacion?.direccion_texto ?? "");
      })
      .catch(() => setRestaurante(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !nombre) {
      toast("El nombre es requerido", "error");
      return;
    }
    setIsSaving(true);
    try {
      await restaurantesApi.update(id, {
        nombre,
        descripcion,
        categoria_principal: categoriaPrincipal,
        estado,
        contacto: { telefono, email },
        ubicacion: { direccion_texto: direccionTexto },
      });
      toast("Restaurante actualizado", "success");
      router.push(`/restaurantes/${id}`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setIsSaving(false);
    }
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
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Restaurante no encontrado.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
            <Edit size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Restaurante</h1>
            <p className="text-sm text-gray-400">{restaurante.nombre}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <Input
            label="Nombre *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripcion</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 hover:border-gray-300 transition-all resize-none"
              placeholder="Describe el restaurante..."
            />
          </div>

          <Input
            label="Categoria principal"
            value={categoriaPrincipal}
            onChange={(e) => setCategoriaPrincipal(e.target.value)}
            placeholder="ej. Italiana, Sushi, Comida rapida"
          />

          <Select
            label="Estado"
            options={ESTADO_OPTIONS}
            value={estado}
            onChange={(e) => setEstado(e.target.value as "activo" | "inactivo")}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+502 1234 5678"
            />
            <Input
              label="Email de contacto"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@restaurante.com"
            />
          </div>

          <Input
            label="Direccion"
            value={direccionTexto}
            onChange={(e) => setDireccionTexto(e.target.value)}
            placeholder="Calle, ciudad, departamento"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(`/restaurantes/${id}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
