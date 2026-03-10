"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Utensils } from "lucide-react";
import { menuItemsApi } from "@/lib/api/menuItems";
import { restaurantesApi } from "@/lib/api/restaurantes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, Restaurante } from "@/types";

export default function MenuItemsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restauranteId, setRestauranteId] = useState("");
  const [disponibleFilter, setDisponibleFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [stats, setStats] = useState({ disponibles: 0, no_disponibles: 0 });

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MenuItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [bulkDisableOpen, setBulkDisableOpen] = useState(false);
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);

  // Forms
  const [formNombre, setFormNombre] = useState("");
  const [formDescripcion, setFormDescripcion] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formPrecio, setFormPrecio] = useState("");
  const [formDisponible, setFormDisponible] = useState(true);
  const [formRestauranteId, setFormRestauranteId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [bulkUmbral, setBulkUmbral] = useState("0");
  const [bulkPorcentaje, setBulkPorcentaje] = useState("0");
  const [bulkCategoria, setBulkCategoria] = useState("");

  useEffect(() => {
    restaurantesApi.list({ limit: "200" }).then((r) => setRestaurantes(r.data)).catch(() => {});
    menuItemsApi.statsCount().then((r) => setStats({ disponibles: r.data.disponibles, no_disponibles: r.data.no_disponibles })).catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { limit: "100" };
      if (restauranteId) params.restaurante_id = restauranteId;
      if (disponibleFilter !== "") params.disponible = disponibleFilter;
      if (categoriaFilter) params.categoria = categoriaFilter;
      const res = await menuItemsApi.list(params);
      setItems(res.data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [restauranteId, disponibleFilter, categoriaFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function openCreate() {
    setFormNombre(""); setFormDescripcion(""); setFormCategoria("");
    setFormPrecio(""); setFormDisponible(true); setFormRestauranteId(restauranteId);
    setCreateOpen(true);
  }

  function openEdit(item: MenuItem) {
    setFormNombre(item.nombre); setFormDescripcion(item.descripcion);
    setFormCategoria(item.categoria); setFormPrecio(String(item.precio));
    setFormDisponible(item.disponible); setFormRestauranteId(item.restaurante_id);
    setEditTarget(item);
  }

  async function handleCreate() {
    if (!formNombre || !formPrecio || !formRestauranteId) {
      toast("Completa los campos requeridos", "error"); return;
    }
    setFormSubmitting(true);
    try {
      await menuItemsApi.create({
        nombre: formNombre, descripcion: formDescripcion,
        categoria: formCategoria, precio: parseFloat(formPrecio),
        disponible: formDisponible, restaurante_id: formRestauranteId,
      });
      toast("Item creado", "success");
      setCreateOpen(false);
      fetchItems();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al crear", "error");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!editTarget || !formNombre || !formPrecio) {
      toast("Completa los campos requeridos", "error"); return;
    }
    setFormSubmitting(true);
    try {
      await menuItemsApi.update(editTarget._id, {
        nombre: formNombre, descripcion: formDescripcion,
        categoria: formCategoria, precio: parseFloat(formPrecio),
        disponible: formDisponible,
      });
      toast("Item actualizado", "success");
      setEditTarget(null);
      fetchItems();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al actualizar", "error");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setFormSubmitting(true);
    try {
      await menuItemsApi.delete(deleteTarget._id);
      toast("Item eliminado", "success");
      setDeleteTarget(null);
      fetchItems();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error al eliminar", "error");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleBulkDisable() {
    setFormSubmitting(true);
    try {
      await menuItemsApi.bulkDisable({
        restaurante_id: restauranteId || undefined,
        umbral: parseFloat(bulkUmbral) || 0,
      });
      toast("Items deshabilitados", "success");
      setBulkDisableOpen(false);
      fetchItems();
      menuItemsApi.statsCount().then((r) => setStats({ disponibles: r.data.disponibles, no_disponibles: r.data.no_disponibles })).catch(() => {});
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleBulkPrice() {
    if (!bulkCategoria) { toast("Selecciona una categoria", "error"); return; }
    setFormSubmitting(true);
    try {
      await menuItemsApi.bulkPrice({ categoria: bulkCategoria, porcentaje: parseFloat(bulkPorcentaje) || 0 });
      toast("Precios ajustados", "success");
      setBulkPriceOpen(false);
      fetchItems();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setFormSubmitting(false);
    }
  }

  const restauranteOptions = [
    { value: "", label: "Todos los restaurantes" },
    ...restaurantes.map((r) => ({ value: r._id, label: r.nombre })),
  ];

  const disponibleOptions = [
    { value: "", label: "Todos" },
    { value: "true", label: "Disponibles" },
    { value: "false", label: "No disponibles" },
  ];

  const categorias = Array.from(new Set(items.map((i) => i.categoria).filter(Boolean)));

  const ItemForm = (
    <div className="space-y-4">
      <Select
        label="Restaurante *"
        options={restaurantes.map((r) => ({ value: r._id, label: r.nombre }))}
        placeholder="Selecciona..."
        value={formRestauranteId}
        onChange={(e) => setFormRestauranteId(e.target.value)}
      />
      <Input label="Nombre *" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} />
      <Input label="Descripcion" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} />
      <Input label="Categoria" value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)} />
      <Input label="Precio *" type="number" value={formPrecio} onChange={(e) => setFormPrecio(e.target.value)} min="0" step="0.01" />
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="disponible-check"
          checked={formDisponible}
          onChange={(e) => setFormDisponible(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-300 cursor-pointer"
        />
        <label htmlFor="disponible-check" className="text-sm font-medium text-gray-700 cursor-pointer">Disponible</label>
      </div>
    </div>
  );

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
              <Utensils size={20} className="text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
              <p className="text-sm text-gray-400">Gestiona los productos del menu</p>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={openCreate}>
            <Plus size={15} />
            Nuevo item
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 text-sm font-medium text-green-700">
            {stats.disponibles} disponibles
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-sm font-medium text-red-600">
            {stats.no_disponibles} no disponibles
          </div>
        </div>

        {/* Bulk actions */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Button variant="secondary" size="sm" onClick={() => setBulkDisableOpen(true)}>
            Deshabilitar sin ventas
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { setBulkCategoria(""); setBulkPorcentaje("0"); setBulkPriceOpen(true); }}>
            Ajustar precio
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="w-56">
            <Select options={restauranteOptions} value={restauranteId} onChange={(e) => setRestauranteId(e.target.value)} />
          </div>
          <div className="w-36">
            <Select options={disponibleOptions} value={disponibleFilter} onChange={(e) => setDisponibleFilter(e.target.value)} />
          </div>
          {categorias.length > 0 && (
            <div className="w-40">
              <Select
                options={[{ value: "", label: "Categorias" }, ...categorias.map((c) => ({ value: c, label: c }))]}
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Items grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Sin items" description="No se encontraron items del menu." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{item.nombre}</h3>
                  <Badge variant={item.disponible ? "green" : "red"} className="shrink-0">
                    {item.disponible ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {item.descripcion && (
                  <p className="text-xs text-gray-500 line-clamp-2">{item.descripcion}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div>
                    <Badge variant="gray">{item.categoria || "Sin categoria"}</Badge>
                    <p className="text-sm font-bold text-amber-600 mt-1">{formatCurrency(item.precio, item.moneda)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo Item" size="md">
        <div className="space-y-4">
          {ItemForm}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" isLoading={formSubmitting} onClick={handleCreate}>Crear</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Item" size="md">
        <div className="space-y-4">
          {ItemForm}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setEditTarget(null)}>Cancelar</Button>
            <Button variant="primary" size="sm" isLoading={formSubmitting} onClick={handleEdit}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar item" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Seguro que deseas eliminar <span className="font-semibold">{deleteTarget?.nombre}</span>?</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" isLoading={formSubmitting} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk disable modal */}
      <Modal isOpen={bulkDisableOpen} onClose={() => setBulkDisableOpen(false)} title="Deshabilitar sin ventas" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Deshabilita items con menos de N ventas totales.</p>
          <Input
            label="Umbral minimo de ventas"
            type="number"
            value={bulkUmbral}
            onChange={(e) => setBulkUmbral(e.target.value)}
            min="0"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBulkDisableOpen(false)}>Cancelar</Button>
            <Button variant="danger" size="sm" isLoading={formSubmitting} onClick={handleBulkDisable}>Deshabilitar</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk price modal */}
      <Modal isOpen={bulkPriceOpen} onClose={() => setBulkPriceOpen(false)} title="Ajustar precios" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Ajusta el precio de todos los items de una categoria por un porcentaje.</p>
          <Input label="Categoria" value={bulkCategoria} onChange={(e) => setBulkCategoria(e.target.value)} placeholder="ej. bebidas" />
          <Input
            label="Porcentaje (+ o -)"
            type="number"
            value={bulkPorcentaje}
            onChange={(e) => setBulkPorcentaje(e.target.value)}
            helperText="Usa 10 para +10%, -10 para -10%"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setBulkPriceOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" isLoading={formSubmitting} onClick={handleBulkPrice}>Aplicar</Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
