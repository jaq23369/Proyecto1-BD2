"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { restaurantesApi } from "@/lib/api/restaurantes";
import { menuItemsApi } from "@/lib/api/menuItems";
import { ordenesApi } from "@/lib/api/ordenes";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { formatCurrency } from "@/lib/utils";
import type { Restaurante, MenuItem } from "@/types";

const METODO_PAGO_OPTIONS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta de credito/debito" },
  { value: "transferencia", label: "Transferencia bancaria" },
];

type Step = 1 | 2 | 3;

interface CartItem {
  menu_item_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export default function NuevaOrdenPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [restauranteId, setRestauranteId] = useState("");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notasCliente, setNotasCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [costoEnvio, setCostoEnvio] = useState("15");
  const [isLoadingRestaurantes, setIsLoadingRestaurantes] = useState(true);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [restauranteSearch, setRestauranteSearch] = useState("");

  useEffect(() => {
    restaurantesApi.list({ estado: "activo", limit: "100" })
      .then((r) => setRestaurantes(r.data))
      .catch(() => {})
      .finally(() => setIsLoadingRestaurantes(false));
  }, []);

  const loadMenu = useCallback(async (rId: string) => {
    setIsLoadingMenu(true);
    try {
      const res = await menuItemsApi.list({ restaurante_id: rId, disponible: "true", limit: "100" });
      setMenuItems(res.data);
    } catch {
      setMenuItems([]);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    if (restauranteId) loadMenu(restauranteId);
  }, [restauranteId, loadMenu]);

  function handleSelectRestaurante(rId: string) {
    setRestauranteId(rId);
    setCart([]);
  }

  function updateQty(item: MenuItem, delta: number) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item._id);
      if (existing) {
        const newQty = existing.cantidad + delta;
        if (newQty <= 0) return prev.filter((c) => c.menu_item_id !== item._id);
        return prev.map((c) =>
          c.menu_item_id === item._id ? { ...c, cantidad: newQty } : c
        );
      }
      if (delta > 0) {
        return [...prev, { menu_item_id: item._id, nombre: item.nombre, precio: item.precio, cantidad: 1 }];
      }
      return prev;
    });
  }

  function getQty(itemId: string): number {
    return cart.find((c) => c.menu_item_id === itemId)?.cantidad ?? 0;
  }

  const subtotal = cart.reduce((acc, c) => acc + c.precio * c.cantidad, 0);
  const envio = parseFloat(costoEnvio) || 0;
  const total = subtotal + envio;

  async function handleSubmit() {
    if (!user) { toast("Inicia sesion para continuar", "error"); return; }
    if (!restauranteId) { toast("Selecciona un restaurante", "error"); return; }
    if (cart.length === 0) { toast("Agrega al menos un item", "error"); return; }
    setIsSubmitting(true);
    try {
      const res = await ordenesApi.create({
        usuario_id: user.userId,
        restaurante_id: restauranteId,
        items: cart.map((c) => ({ menu_item_id: c.menu_item_id, cantidad: c.cantidad })),
        costo_envio: envio,
        metodo_pago: metodoPago,
        notas_cliente: notasCliente,
      });
      toast("Orden creada exitosamente", "success");
      router.push(`/ordenes/${res.data.orden_id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear orden";
      toast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredRestaurantes = restaurantes.filter((r) =>
    r.nombre.toLowerCase().includes(restauranteSearch.toLowerCase())
  );

  const selectedRestaurante = restaurantes.find((r) => r._id === restauranteId);

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100">
            <ShoppingCart size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Orden</h1>
            <p className="text-sm text-gray-400">Crea un nuevo pedido</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? "bg-amber-500 text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s}
              </div>
              <span className={`text-sm font-medium ${step === s ? "text-gray-900" : "text-gray-400"}`}>
                {s === 1 ? "Restaurante" : s === 2 ? "Productos" : "Entrega"}
              </span>
              {s < 3 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select restaurant */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Selecciona un restaurante</h2>
            <Input
              placeholder="Buscar restaurante..."
              value={restauranteSearch}
              onChange={(e) => setRestauranteSearch(e.target.value)}
              className="mb-4"
            />
            {isLoadingRestaurantes ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredRestaurantes.map((r) => (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => handleSelectRestaurante(r._id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                      restauranteId === r._id
                        ? "border-amber-400 bg-amber-50"
                        : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{r.nombre}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.categoria_principal}</p>
                      </div>
                      <Badge variant="green">activo</Badge>
                    </div>
                  </button>
                ))}
                {filteredRestaurantes.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">Sin resultados</p>
                )}
              </div>
            )}
            <div className="flex justify-end mt-5">
              <Button
                variant="primary"
                disabled={!restauranteId}
                onClick={() => setStep(2)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select items */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-800 mb-1">
                Menu de {selectedRestaurante?.nombre}
              </h2>
              <p className="text-sm text-gray-400 mb-4">Selecciona los productos</p>
              {isLoadingMenu ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : menuItems.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin items disponibles</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menuItems.map((item) => {
                    const qty = getQty(item._id);
                    const mainImg = item.imagenes?.find((i) => i.principal) ?? item.imagenes?.[0];
                    const imgSrc = mainImg
                      ? (mainImg.url.startsWith("http") ? mainImg.url : `http://localhost:4000${mainImg.url}`)
                      : null;
                    return (
                      <div key={item._id} className="flex items-center gap-3 border border-slate-200/60 rounded-xl overflow-hidden hover:border-brand-200 hover:shadow-soft transition-all bg-white">
                        {/* Thumbnail */}
                        {imgSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imgSrc} alt={item.nombre} className="w-16 h-16 object-cover shrink-0" />
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-base font-black text-slate-300 select-none">
                              {item.nombre.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 py-2 pr-1">
                          <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{item.nombre}</p>
                          <p className="text-xs text-brand-600 font-bold mt-0.5">{formatCurrency(item.precio, item.moneda)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 pr-3">
                          {qty > 0 ? (
                            <>
                              <button
                                onClick={() => updateQty(item, -1)}
                                className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="text-sm font-bold text-slate-800 w-5 text-center">{qty}</span>
                              <button
                                onClick={() => updateQty(item, 1)}
                                className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white hover:bg-brand-700 cursor-pointer transition-colors"
                              >
                                <Plus size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => updateQty(item, 1)}
                              className="w-7 h-7 rounded-full border-2 border-brand-400 flex items-center justify-center text-brand-500 hover:bg-brand-50 cursor-pointer transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart summary */}
            {cart.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-2">
                  Carrito ({cart.reduce((a, c) => a + c.cantidad, 0)} items)
                </p>
                <div className="space-y-1.5">
                  {cart.map((c) => (
                    <div key={c.menu_item_id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{c.nombre} x{c.cantidad}</span>
                      <span className="text-gray-700 font-medium">{formatCurrency(c.precio * c.cantidad)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-amber-200 pt-2 mt-2 flex justify-between text-sm font-bold text-amber-800">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>Atras</Button>
              <Button variant="primary" disabled={cart.length === 0} onClick={() => setStep(3)}>
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Delivery info */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 mb-4">Informacion de entrega</h2>
            <Select
              label="Metodo de pago"
              options={METODO_PAGO_OPTIONS}
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
            />
            <Input
              label="Costo de envio (GTQ)"
              type="number"
              value={costoEnvio}
              onChange={(e) => setCostoEnvio(e.target.value)}
              min="0"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notas para el restaurante</label>
              <textarea
                value={notasCliente}
                onChange={(e) => setNotasCliente(e.target.value)}
                placeholder="Sin cebolla, extra salsa, etc."
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400 hover:border-gray-300 transition-all resize-none"
              />
            </div>

            {/* Final summary */}
            <div className="bg-gray-50 rounded-xl p-4 mt-2 space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Resumen final</h3>
              {cart.map((c) => (
                <div key={c.menu_item_id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{c.nombre} x{c.cantidad}</span>
                  <span className="text-gray-700">{formatCurrency(c.precio * c.cantidad)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-500">Envio</span>
                <span className="text-gray-700">{formatCurrency(envio)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-amber-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(2)}>Atras</Button>
              <Button variant="primary" isLoading={isSubmitting} onClick={handleSubmit}>
                Confirmar orden
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
