export interface AuthUser {
  userId: string;
  email: string;
  nombre: string;
  tipo_usuario: "cliente" | "admin";
}

export interface Geo {
  type: "Point";
  coordinates: [number, number];
}

export interface Direccion {
  alias: string;
  direccion_texto: string;
  geo?: Geo;
}

export interface Restaurante {
  _id: string;
  nombre: string;
  slug: string;
  categoria_principal: string;
  categorias: string[];
  descripcion: string;
  estado: "activo" | "inactivo";
  contacto: { telefono?: string; email?: string };
  ubicacion: { direccion_texto?: string; geo?: Geo };
  horarios: Array<{ dia: string; apertura: string; cierre: string }>;
  estadisticas: { rating_promedio: number; total_resenas: number; total_ordenes: number };
  fecha_creacion: string;
  distancia_m?: number;
  imagen_url?: string;
}

export interface MenuItem {
  _id: string;
  restaurante_id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  moneda: string;
  disponible: boolean;
  tags: string[];
  imagenes: Array<{ url: string; principal: boolean }>;
  opciones: Array<{ nombre: string; valores: Array<{ nombre: string; incremento: number }> }>;
  metricas: { veces_pedido: number };
}

export type EstadoOrden = "creada" | "confirmada" | "en_preparacion" | "en_camino" | "entregada" | "cancelada";

export interface OrdenItem {
  menu_item_id: string;
  nombre_snapshot: string;
  precio_unitario_snapshot: number;
  cantidad: number;
  subtotal: number;
  opciones_seleccionadas: string[];
}

export interface HistorialEstado {
  estado: EstadoOrden;
  fecha: string;
  usuario_evento: string;
}

export interface Orden {
  _id: string;
  codigo_orden: string | null;
  usuario_id: string;
  restaurante_id: string;
  estado_orden: EstadoOrden;
  notas_cliente: string;
  direccion_entrega: Direccion | null;
  items: OrdenItem[];
  resumen_pago: {
    subtotal: number;
    costo_envio: number;
    descuento: number;
    impuestos: number;
    total: number;
    metodo_pago: string;
    estado_pago: string;
  };
  historial_estados: HistorialEstado[];
  fecha_creacion: string;
  fecha_actualizacion: string;
  usuario?: { _id: string; nombre: string; email: string };
  restaurante?: { _id: string; nombre: string; categoria_principal: string };
}

export interface Resena {
  _id: string;
  orden_id: string;
  usuario_id: string;
  restaurante_id: string;
  calificacion: number;
  comentario: string;
  aspectos: { sabor: number; tiempo_entrega: number; presentacion: number };
  visible: boolean;
  fecha_creacion: string;
  usuario?: { _id: string; nombre: string };
}

export interface Usuario {
  _id: string;
  tipo_usuario: "cliente" | "admin";
  nombre: string;
  email: string;
  telefono: string;
  estado: "activo" | "inactivo";
  direccion_principal: Direccion;
  direcciones: Direccion[];
  preferencias: { idioma: string; notificaciones: boolean };
  fecha_creacion: string;
}

export interface UploadedFile {
  fileId: string;
  filename: string;
  size: number;
  mimetype: string;
  descripcion?: string;
  tipo?: string;
  ref_id?: string;
  fecha_subida: string;
  url: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface SingleResponse<T> {
  data: T;
}
