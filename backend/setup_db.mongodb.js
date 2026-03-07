// =============================================================
// PROYECTO 1 - BD2 | Script de inicializacion
// Crea las colecciones, inserta data base y luego el bulk
// =============================================================

use("restaurantes_db");

// Limpiar colecciones si ya existen, para empezar limpio
db.usuarios.drop();
db.restaurantes.drop();
db.menu_items.drop();
db.ordenes.drop();
db.resenas.drop();

// Crear las 5 colecciones del proyecto
db.createCollection("usuarios");
db.createCollection("restaurantes");
db.createCollection("menu_items");
db.createCollection("ordenes");
db.createCollection("resenas");

print("Colecciones creadas: usuarios, restaurantes, menu_items, ordenes, resenas");

// --- USUARIOS ---
// Embedded: direccion_principal, direcciones, preferencias
// Se embeben porque siempre se consultan junto con el usuario y no tienen sentido fuera de el.
use("restaurantes_db");
db.usuarios.insertMany([
  {
    tipo_usuario: "cliente",
    nombre: "Nery Molina",
    email: "nery@bd2proyecto.com",
    telefono: "+50212345678",
    estado: "activo",
    direccion_principal: {
      alias: "Casa",
      direccion_texto: "Zona 7, Guatemala",
      geo: { type: "Point", coordinates: [-90.5500, 14.6200] },
    },
    direcciones: [
      {
        alias: "Trabajo",
        direccion_texto: "Zona 10, Guatemala",
        geo: { type: "Point", coordinates: [-90.5100, 14.6000] },
      },
    ],
    preferencias: { idioma: "es", notificaciones: true },
    fecha_creacion: new Date("2026-01-15T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-15T10:00:00Z"),
  },
  {
    tipo_usuario: "cliente",
    nombre: "Joel Jaquez",
    email: "joel@bd2proyecto.com",
    telefono: "+50287654321",
    estado: "activo",
    direccion_principal: {
      alias: "Casa",
      direccion_texto: "Zona 14, Guatemala",
      geo: { type: "Point", coordinates: [-90.5000, 14.5800] },
    },
    direcciones: [],
    preferencias: { idioma: "es", notificaciones: false },
    fecha_creacion: new Date("2026-01-16T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-16T10:00:00Z"),
  },
  {
    tipo_usuario: "admin",
    nombre: "Luis Gonzalez",
    email: "luis@bd2proyecto.com",
    telefono: "+50299998888",
    estado: "activo",
    direccion_principal: {
      alias: "Oficina",
      direccion_texto: "Zona 9, Guatemala",
      geo: { type: "Point", coordinates: [-90.5200, 14.6100] },
    },
    direcciones: [],
    preferencias: { idioma: "es", notificaciones: true },
    fecha_creacion: new Date("2026-01-10T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-10T10:00:00Z"),
  },
  {
    tipo_usuario: "cliente",
    nombre: "Maria Garcia",
    email: "maria.garcia@bd2proyecto.com",
    telefono: "+50277776666",
    estado: "activo",
    direccion_principal: {
      alias: "Apartamento",
      direccion_texto: "Zona 15, Guatemala",
      geo: { type: "Point", coordinates: [-90.4900, 14.5700] },
    },
    direcciones: [
      {
        alias: "Universidad",
        direccion_texto: "Zona 12, Guatemala",
        geo: { type: "Point", coordinates: [-90.5300, 14.5900] },
      },
    ],
    preferencias: { idioma: "es", notificaciones: true },
    fecha_creacion: new Date("2026-01-20T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-20T10:00:00Z"),
  },
  {
    tipo_usuario: "cliente",
    nombre: "Carlos Perez",
    email: "carlos.perez@bd2proyecto.com",
    telefono: "+50255554444",
    estado: "inactivo",
    direccion_principal: {
      alias: "Casa",
      direccion_texto: "Zona 6, Guatemala",
      geo: { type: "Point", coordinates: [-90.5600, 14.6400] },
    },
    direcciones: [],
    preferencias: { idioma: "es", notificaciones: false },
    fecha_creacion: new Date("2026-01-22T10:00:00Z"),
    fecha_actualizacion: new Date("2026-02-01T10:00:00Z"),
  },
]);
print("Usuarios base insertados: " + db.usuarios.countDocuments());


// --- RESTAURANTES ---
// Embedded: contacto, ubicacion, horarios, estadisticas
// Todo esto se lee siempre junto con el restaurante y ninguno de estos datos tiene sentido por separado.
use("restaurantes_db");
const restaurantes = db.restaurantes.insertMany([
  {
    nombre: "Pizza Central",
    slug: "pizza-central",
    categoria_principal: "Pizza",
    categorias: ["Pizza", "Italiana", "Comida rapida"],
    descripcion: "Las mejores pizzas artesanales de Guatemala",
    estado: "activo",
    contacto: {
      telefono: "+50222223333",
      email: "info@pizzacentral.com",
    },
    ubicacion: {
      direccion_texto: "4a Avenida 12-59, Zona 10",
      geo: { type: "Point", coordinates: [-90.5100, 14.6000] },
    },
    horarios: [
      { dia: "Lunes",     apertura: "10:00", cierre: "22:00" },
      { dia: "Martes",    apertura: "10:00", cierre: "22:00" },
      { dia: "Miercoles", apertura: "10:00", cierre: "22:00" },
      { dia: "Jueves",    apertura: "10:00", cierre: "23:00" },
      { dia: "Viernes",   apertura: "10:00", cierre: "23:00" },
      { dia: "Sabado",    apertura: "11:00", cierre: "23:00" },
      { dia: "Domingo",   apertura: "11:00", cierre: "21:00" },
    ],
    estadisticas: {
      rating_promedio: 4.6,
      total_resenas: 0,
      total_ordenes: 0,
    },
    fecha_creacion: new Date("2025-06-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    nombre: "Burger House GT",
    slug: "burger-house-gt",
    categoria_principal: "Hamburguesas",
    categorias: ["Hamburguesas", "Americana", "Comida rapida"],
    descripcion: "Hamburguesas gourmet con carne angus y papas artesanales",
    estado: "activo",
    contacto: {
      telefono: "+50244445555",
      email: "info@burgerhouse.gt",
    },
    ubicacion: {
      direccion_texto: "6a Calle 3-67, Zona 4",
      geo: { type: "Point", coordinates: [-90.5300, 14.6300] },
    },
    horarios: [
      { dia: "Lunes",     apertura: "11:00", cierre: "21:00" },
      { dia: "Martes",    apertura: "11:00", cierre: "21:00" },
      { dia: "Miercoles", apertura: "11:00", cierre: "21:00" },
      { dia: "Jueves",    apertura: "11:00", cierre: "22:00" },
      { dia: "Viernes",   apertura: "11:00", cierre: "22:00" },
      { dia: "Sabado",    apertura: "12:00", cierre: "22:00" },
    ],
    estadisticas: {
      rating_promedio: 4.3,
      total_resenas: 0,
      total_ordenes: 0,
    },
    fecha_creacion: new Date("2025-08-15T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    nombre: "Sushi Zen",
    slug: "sushi-zen",
    categoria_principal: "Japonesa",
    categorias: ["Sushi", "Japonesa", "Mariscos", "Saludable"],
    descripcion: "Sushi fresco y autentico preparado por chefs japoneses",
    estado: "activo",
    contacto: {
      telefono: "+50233336666",
      email: "info@sushizen.gt",
    },
    ubicacion: {
      direccion_texto: "13 Calle 1-25, Zona 10",
      geo: { type: "Point", coordinates: [-90.5050, 14.5950] },
    },
    horarios: [
      { dia: "Martes",    apertura: "12:00", cierre: "22:00" },
      { dia: "Miercoles", apertura: "12:00", cierre: "22:00" },
      { dia: "Jueves",    apertura: "12:00", cierre: "22:00" },
      { dia: "Viernes",   apertura: "12:00", cierre: "23:00" },
      { dia: "Sabado",    apertura: "12:00", cierre: "23:00" },
      { dia: "Domingo",   apertura: "13:00", cierre: "21:00" },
    ],
    estadisticas: {
      rating_promedio: 4.8,
      total_resenas: 0,
      total_ordenes: 0,
    },
    fecha_creacion: new Date("2025-09-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
]);

const restId1 = restaurantes.insertedIds[0]; // Pizza Central
const restId2 = restaurantes.insertedIds[1]; // Burger House
const restId3 = restaurantes.insertedIds[2]; // Sushi Zen
print("Restaurantes base insertados: " + db.restaurantes.countDocuments());


// --- MENU ITEMS ---
// Referenciado: restaurante_id apunta a la coleccion restaurantes
// porque un restaurante tiene muchos items y el menu cambia de forma independiente al restaurante.
// Embedded: imagenes, opciones, metricas son datos que solo tienen sentido dentro de cada item del menu.
use("restaurantes_db");
const menuItems = db.menu_items.insertMany([
  {
    restaurante_id: restId1,
    nombre: "Pizza Pepperoni Familiar",
    descripcion: "Salsa de tomate artesanal, queso mozzarella y pepperoni premium",
    categoria: "Pizzas",
    precio: 95.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["pepperoni", "familiar", "pizza", "carne"],
    imagenes: [{ url: "https://images.unsplash.com/photo-1692737580547-b45bb4a02356?q=80&w=915&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [
      {
        nombre: "Tamano",
        valores: [
          { nombre: "Mediana",  incremento: 0  },
          { nombre: "Familiar", incremento: 20 },
        ],
      },
    ],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-06-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId1,
    nombre: "Pizza Hawaiana",
    descripcion: "Salsa de tomate, queso mozzarella, jamon y pina fresca",
    categoria: "Pizzas",
    precio: 85.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["hawaiana", "pina", "jamon", "pizza"],
    imagenes: [{ url: "https://plus.unsplash.com/premium_photo-1672498268734-0f41e888298d?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [
      {
        nombre: "Tamano",
        valores: [
          { nombre: "Mediana",  incremento: 0  },
          { nombre: "Familiar", incremento: 20 },
        ],
      },
    ],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-06-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId1,
    nombre: "Lasagna Clasica",
    descripcion: "Capas de pasta, carne molida, salsa bechamel y queso gratinado",
    categoria: "Pastas",
    precio: 75.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["lasagna", "pasta", "carne", "italiana"],
    imagenes: [{ url: "https://plus.unsplash.com/premium_photo-1723770033472-0b0452d98225?q=80&w=1397&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-06-15T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId2,
    nombre: "Classic Burger",
    descripcion: "Carne angus 200g, lechuga, tomate, cebolla caramelizada y papas",
    categoria: "Hamburguesas",
    precio: 65.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["hamburguesa", "angus", "classic", "papas"],
    imagenes: [{ url: "https://plus.unsplash.com/premium_photo-1683619761492-639240d29bb5?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [
      {
        nombre: "Termino de carne",
        valores: [
          { nombre: "Medio",       incremento: 0 },
          { nombre: "Bien cocido", incremento: 0 },
        ],
      },
    ],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-08-15T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId2,
    nombre: "BBQ Bacon Burger",
    descripcion: "Carne angus, tocino crujiente, queso cheddar y salsa BBQ ahumada",
    categoria: "Hamburguesas",
    precio: 79.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["hamburguesa", "bacon", "bbq", "cheddar"],
    imagenes: [{ url: "https://images.unsplash.com/photo-1718912053452-462af446bb8d?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-08-15T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId2,
    nombre: "Chicken Crispy",
    descripcion: "Pechuga de pollo empanizada, coleslaw, pepinillos y salsa ranch",
    categoria: "Pollo",
    precio: 58.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["pollo", "crispy", "empanizado", "ranch"],
    imagenes: [{ url: "https://images.unsplash.com/photo-1675063181362-d5d037db4214?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-09-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId3,
    nombre: "Roll Salmon Premium",
    descripcion: "8 piezas de roll de salmon fresco con aguacate y queso crema",
    categoria: "Rolls",
    precio: 89.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["salmon", "roll", "sushi", "aguacate"],
    imagenes: [{ url: "https://plus.unsplash.com/premium_photo-1723489388483-eb3b235acaf9?q=80&w=1357&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [
      {
        nombre: "Salsa",
        valores: [
          { nombre: "Soya regular",     incremento: 0 },
          { nombre: "Soya baja en sal", incremento: 0 },
          { nombre: "Teriyaki",         incremento: 5 },
        ],
      },
    ],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-09-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId3,
    nombre: "Combo Sashimi 12 piezas",
    descripcion: "Seleccion de salmon, atun y pescado blanco en laminas frescas",
    categoria: "Sashimi",
    precio: 125.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["sashimi", "salmon", "atun", "fresco", "premium"],
    imagenes: [{ url: "https://images.unsplash.com/photo-1638866381709-071747b518c8?q=80&w=1412&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-09-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
  {
    restaurante_id: restId3,
    nombre: "Ramen Shoyu",
    descripcion: "Caldo de soya con chashu, huevo marinado, nori y cebollin",
    categoria: "Ramen",
    precio: 95.00,
    moneda: "GTQ",
    disponible: false,
    tags: ["ramen", "caldo", "japones", "chashu"],
    imagenes: [{ url: "https://plus.unsplash.com/premium_photo-1694628644956-e94194387f48?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", principal: true }],
    opciones: [],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date("2025-10-01T10:00:00Z"),
    fecha_actualizacion: new Date("2026-01-01T10:00:00Z"),
  },
]);

const itemId1 = menuItems.insertedIds[0]; // Pizza Pepperoni
const itemId2 = menuItems.insertedIds[3]; // Classic Burger
const itemId3 = menuItems.insertedIds[6]; // Roll Salmon
const itemId4 = menuItems.insertedIds[4]; // BBQ Bacon Burger
print("Menu items base insertados: " + db.menu_items.countDocuments());


// --- ORDENES ---
// Referenciado: usuario_id y restaurante_id apuntan a sus colecciones
// porque tanto el usuario como el restaurante existen de forma independiente.
// Embedded: direccion_entrega, items, resumen_pago, historial_estados
// La direccion se embebe como snapshot porque aunque el usuario
// cambie su direccion despues, la orden debe conservar la original.
// Los items tambien son snapshot: guardan nombre y precio al momento
// de la compra, por si el restaurante los modifica despues.
use("restaurantes_db");
const u1 = db.usuarios.findOne({ email: "nery@bd2proyecto.com" })._id;
const u2 = db.usuarios.findOne({ email: "joel@bd2proyecto.com" })._id;
const u3 = db.usuarios.findOne({ email: "maria.garcia@bd2proyecto.com" })._id;

const ordenes = db.ordenes.insertMany([
  {
    codigo_orden: "ORD-2026-000001",
    usuario_id: u1,
    restaurante_id: restId1,
    estado_orden: "entregada",
    notas_cliente: "Sin cebolla por favor",
    direccion_entrega: {
      alias: "Casa",
      direccion_texto: "Zona 7, Guatemala",
      geo: { type: "Point", coordinates: [-90.5500, 14.6200] },
    },
    items: [
      {
        menu_item_id: itemId1,
        nombre_snapshot: "Pizza Pepperoni Familiar",
        precio_unitario_snapshot: 95.00,
        cantidad: 2,
        subtotal: 190.00,
      },
    ],
    resumen_pago: {
      subtotal: 190.00,
      costo_envio: 15.00,
      descuento: 0,
      impuestos: 0,
      total: 205.00,
      metodo_pago: "tarjeta",
      estado_pago: "pagado",
    },
    historial_estados: [
      { estado: "creada",         fecha: new Date("2026-02-10T18:00:00Z"), usuario_evento: "sistema" },
      { estado: "confirmada",     fecha: new Date("2026-02-10T18:02:00Z"), usuario_evento: "restaurante" },
      { estado: "en_preparacion", fecha: new Date("2026-02-10T18:10:00Z"), usuario_evento: "restaurante" },
      { estado: "en_camino",      fecha: new Date("2026-02-10T18:35:00Z"), usuario_evento: "repartidor" },
      { estado: "entregada",      fecha: new Date("2026-02-10T18:55:00Z"), usuario_evento: "sistema" },
    ],
    fecha_creacion: new Date("2026-02-10T18:00:00Z"),
    fecha_actualizacion: new Date("2026-02-10T18:55:00Z"),
  },
  {
    codigo_orden: "ORD-2026-000002",
    usuario_id: u2,
    restaurante_id: restId2,
    estado_orden: "en_camino",
    notas_cliente: "Carne bien cocida",
    direccion_entrega: {
      alias: "Casa",
      direccion_texto: "Zona 14, Guatemala",
      geo: { type: "Point", coordinates: [-90.5000, 14.5800] },
    },
    items: [
      {
        menu_item_id: itemId2,
        nombre_snapshot: "Classic Burger",
        precio_unitario_snapshot: 65.00,
        cantidad: 1,
        subtotal: 65.00,
      },
    ],
    resumen_pago: {
      subtotal: 65.00,
      costo_envio: 15.00,
      descuento: 0,
      impuestos: 0,
      total: 80.00,
      metodo_pago: "efectivo",
      estado_pago: "pendiente",
    },
    historial_estados: [
      { estado: "creada",         fecha: new Date("2026-03-05T12:00:00Z"), usuario_evento: "sistema" },
      { estado: "confirmada",     fecha: new Date("2026-03-05T12:03:00Z"), usuario_evento: "restaurante" },
      { estado: "en_preparacion", fecha: new Date("2026-03-05T12:08:00Z"), usuario_evento: "restaurante" },
      { estado: "en_camino",      fecha: new Date("2026-03-05T12:30:00Z"), usuario_evento: "repartidor" },
    ],
    fecha_creacion: new Date("2026-03-05T12:00:00Z"),
    fecha_actualizacion: new Date("2026-03-05T12:30:00Z"),
  },
  {
    codigo_orden: "ORD-2026-000003",
    usuario_id: u3,
    restaurante_id: restId3,
    estado_orden: "entregada",
    notas_cliente: "",
    direccion_entrega: {
      alias: "Apartamento",
      direccion_texto: "Zona 15, Guatemala",
      geo: { type: "Point", coordinates: [-90.4900, 14.5700] },
    },
    items: [
      {
        menu_item_id: itemId3,
        nombre_snapshot: "Roll Salmon Premium",
        precio_unitario_snapshot: 89.00,
        cantidad: 2,
        subtotal: 178.00,
      },
    ],
    resumen_pago: {
      subtotal: 178.00,
      costo_envio: 20.00,
      descuento: 10.00,
      impuestos: 0,
      total: 188.00,
      metodo_pago: "transferencia",
      estado_pago: "pagado",
    },
    historial_estados: [
      { estado: "creada",         fecha: new Date("2026-02-20T19:00:00Z"), usuario_evento: "sistema" },
      { estado: "confirmada",     fecha: new Date("2026-02-20T19:05:00Z"), usuario_evento: "restaurante" },
      { estado: "en_preparacion", fecha: new Date("2026-02-20T19:15:00Z"), usuario_evento: "restaurante" },
      { estado: "en_camino",      fecha: new Date("2026-02-20T19:45:00Z"), usuario_evento: "repartidor" },
      { estado: "entregada",      fecha: new Date("2026-02-20T20:10:00Z"), usuario_evento: "sistema" },
    ],
    fecha_creacion: new Date("2026-02-20T19:00:00Z"),
    fecha_actualizacion: new Date("2026-02-20T20:10:00Z"),
  },
  {
    codigo_orden: "ORD-2026-000004",
    usuario_id: u1,
    restaurante_id: restId2,
    estado_orden: "cancelada",
    notas_cliente: "Sin pepinillos",
    direccion_entrega: {
      alias: "Trabajo",
      direccion_texto: "Zona 10, Guatemala",
      geo: { type: "Point", coordinates: [-90.5100, 14.6000] },
    },
    items: [
      {
        menu_item_id: itemId4,
        nombre_snapshot: "BBQ Bacon Burger",
        precio_unitario_snapshot: 79.00,
        cantidad: 1,
        subtotal: 79.00,
      },
    ],
    resumen_pago: {
      subtotal: 79.00,
      costo_envio: 15.00,
      descuento: 0,
      impuestos: 0,
      total: 94.00,
      metodo_pago: "tarjeta",
      estado_pago: "reembolsado",
    },
    historial_estados: [
      { estado: "creada",    fecha: new Date("2026-02-25T20:00:00Z"), usuario_evento: "sistema" },
      { estado: "cancelada", fecha: new Date("2026-02-25T20:05:00Z"), usuario_evento: "usuario" },
    ],
    fecha_creacion: new Date("2026-02-25T20:00:00Z"),
    fecha_actualizacion: new Date("2026-02-25T20:05:00Z"),
  },
]);

const ordenId1 = ordenes.insertedIds[0];
const ordenId3 = ordenes.insertedIds[2];
print("Ordenes base insertadas: " + db.ordenes.countDocuments());


// --- RESENAS ---
// Referenciado: orden_id, usuario_id, restaurante_id
// cada uno vive en su propia coleccion y se puede consultar
// de forma independiente. La resena los relaciona.
// Embedded: aspectos
// van dentro de la resena porque son parte de la calificacion
// y no tienen sentido fuera de ella.
use("restaurantes_db");
db.resenas.insertMany([
  {
    orden_id:       ordenId1,
    usuario_id:     u1,
    restaurante_id: restId1,
    calificacion: 5,
    comentario: "Excelente pizza, llego caliente y muy bien empacada!",
    aspectos: {
      sabor:          5,
      tiempo_entrega: 4,
      presentacion:   5,
    },
    visible: true,
    fecha_creacion: new Date("2026-02-10T21:00:00Z"),
  },
  {
    orden_id:       ordenId3,
    usuario_id:     u3,
    restaurante_id: restId3,
    calificacion: 5,
    comentario: "El sushi mas fresco que he probado en Guatemala.",
    aspectos: {
      sabor:          5,
      tiempo_entrega: 5,
      presentacion:   5,
    },
    visible: true,
    fecha_creacion: new Date("2026-02-20T21:30:00Z"),
  },
]);
print("Resenas base insertadas: " + db.resenas.countDocuments());


// =============================================================
// SECCION 2: BULK DATA
// Se generan 155,000 documentos con datos variados y
// realistas usando operaciones bulk para mejor rendimiento.
// =============================================================

print("Iniciando generacion de datos bulk...");

// Funciones de apoyo para generar data aleatoria
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function randomGeoGuatemala() {
  return {
    type: "Point",
    coordinates: [
      parseFloat((Math.random() * (-90.450 - -90.620) + -90.620).toFixed(6)),
      parseFloat((Math.random() * (14.680 - 14.530) + 14.530).toFixed(6)),
    ],
  };
}

// Pools de datos para generar variedad
var CATEGORIAS_REST  = ["Pizza","Hamburguesas","Sushi","Mexicana","Italiana","China","Pollo","Mariscos","Vegetariana","Guatemalteca","Americana","Francesa","Tailandesa","Peruana","Arabe"];
var CATEGORIAS_MENU  = ["Entradas","Platos fuertes","Pizzas","Hamburguesas","Pastas","Ensaladas","Postres","Bebidas","Combos","Sopas","Sushi","Rolls","Sashimi","Tacos","Burritos"];
var TAGS_POOL        = ["picante","vegetariano","vegano","sin-gluten","familiar","premium","economico","saludable","tradicional","gourmet","fresco","ahumado","gratinado","artesanal","organico","pollo","carne","mariscos","queso","aguacate"];
var ZONAS_GT         = ["Zona 1","Zona 2","Zona 4","Zona 5","Zona 6","Zona 7","Zona 9","Zona 10","Zona 11","Zona 12","Zona 13","Zona 14","Zona 15","Zona 16","Mixco","Villa Nueva","San Miguel Petapa"];
var NOMBRES          = ["Ana","Carlos","Maria","Jose","Sofia","Diego","Lucia","Andres","Valentina","Miguel","Isabella","Sebastian","Camila","Daniel","Paula","Alejandro","Gabriela","Luis","Fernanda","Ricardo","Natalia","Jorge","Daniela","Eduardo","Mariana","Roberto","Claudia","Francisco","Andrea","Hector"];
var APELLIDOS        = ["Garcia","Rodriguez","Lopez","Martinez","Gonzalez","Perez","Sanchez","Ramirez","Torres","Flores","Rivera","Gomez","Diaz","Cruz","Reyes","Morales","Ortiz","Hernandez","Vargas","Jimenez","Molina","Castillo","Mendoza","Aguilar","Ramos"];
var NOMBRES_REST     = ["La Fogata","El Rincon","Casa Grande","La Plaza","El Portal","Sabor Latino","La Terraza","El Patio","Casa Blanca","La Cupula","El Jardin","La Hacienda","Casa Real","El Mirador","La Colina","Buen Sabor","El Refugio","La Fuente","Casa Verde","El Bosque"];
var ADJETIVOS_REST   = ["Gourmet","Express","Artesanal","Premium","Tradicional","Central","Norte","Sur","del Valle","de la Zona"];
var PLATOS           = ["Pollo a la plancha","Carne asada","Pasta carbonara","Sopa de tomate","Ensalada Cesar","Tacos de carnitas","Pizza margherita","Hamburguesa clasica","Ceviche fresco","Arroz con pollo","Lasagna","Enchiladas","Chiles rellenos","Fettuccine alfredo","Risotto","Costillas BBQ","Salmon al horno","Camarones al ajillo","Tilapia frita","Wrap de pollo","Burritos","Quesadillas","Bowl de quinoa","Curry de verduras","Pad Thai","Ramen especial","Yakisoba","Tempura mixta","Sashimi mixto","Roll California"];
var VARIANTES_PLATO  = ["Especial","Clasico","Premium","Artesanal","del Chef","a la lena","estilo casero","de la casa","con papas","en salsa"];
var COMENTARIOS      = ["Excelente comida, muy recomendado!","La entrega fue rapida y la comida llego caliente.","Buena relacion calidad-precio.","El sabor es increible, volvere a pedir.","Porciones generosas y bien sazonado.","La presentacion fue muy bonita.","Pedido correcto y bien empacado.","Rico pero tardo un poco mas de lo esperado.","Todo perfecto, el mejor restaurante de la zona.","La salsa estaba deliciosa, muy autentico.","Ingredientes frescos y de calidad.","Me encanto, lo recomiendo a todos.","Buen servicio y comida de calidad.","Llego a tiempo y estaba riquisimo.","La carne estaba en su punto perfecto."];
var METODOS_PAGO     = ["efectivo","tarjeta","transferencia"];
var ESTADOS_ORDEN    = ["creada","confirmada","en_preparacion","en_camino","entregada","cancelada"];
var DIAS_SEMANA      = ["Lunes","Martes","Miercoles","Jueves","Viernes","Sabado","Domingo"];
var HORAS_APERTURA   = ["08:00","09:00","10:00","11:00","12:00"];
var HORAS_CIERRE     = ["20:00","21:00","22:00","23:00","00:00"];

// URLs reales de Unsplash por tipo de plato.
// Cada plato tiene asignada una foto real de comida que si carga.
var IMAGENES_PLATOS = {
  "Pollo a la plancha":    "https://images.unsplash.com/photo-1592011432621-f7f576f44484?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Carne asada":           "https://images.unsplash.com/photo-1616252980327-ec70572e5df9?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Pasta carbonara":       "https://images.unsplash.com/photo-1588013273468-315fd88ea34c?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Sopa de tomate":        "https://images.unsplash.com/photo-1629978444632-9f63ba0eff47?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Ensalada Cesar":        "https://plus.unsplash.com/premium_photo-1700089483464-4f76cc3d360b?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Tacos de carnitas":     "https://plus.unsplash.com/premium_photo-1672976349009-918d041258aa?q=80&w=988&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Pizza margherita":      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Hamburguesa clasica":   "https://plus.unsplash.com/premium_photo-1684923609954-e8f7cb7eb3b5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Ceviche fresco":        "https://images.unsplash.com/photo-1626663011519-b42e5ee10056?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Arroz con pollo":       "https://images.unsplash.com/photo-1719670712556-638018bd8238?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Lasagna":               "https://images.unsplash.com/photo-1709429790175-b02bb1b19207?q=80&w=3132&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Enchiladas":            "https://images.unsplash.com/photo-1679605097294-ad339b020c0f?q=80&w=988&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Chiles rellenos":       "https://plus.unsplash.com/premium_photo-1664475990295-e4518c63edaf?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Fettuccine alfredo":    "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Risotto":               "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80",
  "Costillas BBQ":         "https://plus.unsplash.com/premium_photo-1664478272084-532c1bfebd25?q=80&w=1320&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Salmon al horno":       "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Camarones al ajillo":   "https://images.unsplash.com/photo-1748659118761-44a30b82478c?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Tilapia frita":         "https://images.unsplash.com/photo-1719459341702-fc1c814d8dce?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Wrap de pollo":         "https://plus.unsplash.com/premium_photo-1679287668420-80c27ea4fb31?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Burritos":              "https://images.unsplash.com/photo-1562059390-a761a084768e?q=80&w=1419&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Quesadillas":           "https://images.unsplash.com/photo-1618040996337-56904b7850b9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Bowl de quinoa":        "https://plus.unsplash.com/premium_photo-1664391771710-4f7eb2a4649a?q=80&w=1345&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Curry de verduras":     "https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Pad Thai":              "https://images.unsplash.com/photo-1637806930600-37fa8892069d?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Ramen especial":        "https://plus.unsplash.com/premium_photo-1694628173948-2439edd91cd7?q=80&w=678&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Yakisoba":              "https://plus.unsplash.com/premium_photo-1664475934279-2631a25c42ce?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Tempura mixta":         "https://plus.unsplash.com/premium_photo-1667807522245-ae3de2a7813a?q=80&w=1550&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Sashimi mixto":         "https://plus.unsplash.com/premium_photo-1755705514668-586140f14d9a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "Roll California":       "https://plus.unsplash.com/premium_photo-1667545168921-34f756495d7b?q=80&w=1473&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};
// imagen por defecto si el plato no tiene una asignada
var IMAGEN_DEFAULT = "https://images.unsplash.com/photo-1636654129379-e7ae6f30bfd0?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

var FECHA_INICIO = new Date("2025-01-01T00:00:00Z");
var FECHA_FIN    = new Date("2026-03-01T00:00:00Z");


// --- BULK: 5,000 RESTAURANTES ---
use("restaurantes_db");
print("Generando 5,000 restaurantes...");
var bulkRest = db.restaurantes.initializeUnorderedBulkOp();

for (var i = 1; i <= 5000; i++) {
  var categoria = randomFrom(CATEGORIAS_REST);
  var zona      = randomFrom(ZONAS_GT);
  var nombre    = randomFrom(NOMBRES_REST) + " " + randomFrom(ADJETIVOS_REST);

  var cats = [categoria];
  if (Math.random() > 0.4) cats.push(randomFrom(CATEGORIAS_REST));
  if (Math.random() > 0.7) cats.push(randomFrom(CATEGORIAS_REST));
  cats = cats.filter(function(v, i, a) { return a.indexOf(v) === i; });

  var horariosArr = [];
  DIAS_SEMANA.forEach(function(dia) {
    if (Math.random() > 0.15) {
      horariosArr.push({ dia: dia, apertura: randomFrom(HORAS_APERTURA), cierre: randomFrom(HORAS_CIERRE) });
    }
  });

  bulkRest.insert({
    nombre:              nombre + " " + i,
    slug:                nombre.toLowerCase().replace(/\s+/g, "-") + "-" + i,
    categoria_principal: categoria,
    categorias:          cats,
    descripcion:         "Restaurante especializado en " + categoria + " ubicado en " + zona,
    estado:              Math.random() > 0.1 ? "activo" : "inactivo",
    contacto: {
      telefono: "+5022" + randomInt(1000000, 9999999),
      email:    "contacto" + i + "@restaurante.gt",
    },
    ubicacion: {
      direccion_texto: randomInt(1, 20) + " Calle " + randomInt(1, 30) + "-" + randomInt(10, 99) + ", " + zona,
      geo: randomGeoGuatemala(),
    },
    horarios: horariosArr,
    estadisticas: {
      rating_promedio: randomFloat(2.5, 5.0),
      total_resenas:   randomInt(0, 500),
      total_ordenes:   randomInt(0, 5000),
    },
    fecha_creacion:      randomDate(new Date("2020-01-01"), new Date("2025-01-01")),
    fecha_actualizacion: randomDate(new Date("2025-01-01"), FECHA_FIN),
  });
}
bulkRest.execute();
print("Restaurantes totales: " + db.restaurantes.countDocuments());


// --- BULK: 20,000 USUARIOS ---
use("restaurantes_db");
print("Generando 20,000 usuarios...");
var bulkUsers = db.usuarios.initializeUnorderedBulkOp();

for (var i = 1; i <= 20000; i++) {
  var nombre   = randomFrom(NOMBRES);
  var apellido = randomFrom(APELLIDOS);
  var zona     = randomFrom(ZONAS_GT);

  var direccionesExtra = [];
  var numDirs = randomInt(0, 2);
  for (var d = 0; d < numDirs; d++) {
    direccionesExtra.push({
      alias:           randomFrom(["Trabajo","Universidad","Gym","Casa de padres"]),
      direccion_texto: randomInt(1, 20) + " Av. " + randomInt(1, 30) + "-" + randomInt(10, 99) + ", " + randomFrom(ZONAS_GT),
      geo:             randomGeoGuatemala(),
    });
  }

  bulkUsers.insert({
    tipo_usuario: Math.random() > 0.95 ? "admin" : "cliente",
    nombre:       nombre + " " + apellido,
    email:        nombre.toLowerCase() + "." + apellido.toLowerCase() + i + "@email.com",
    telefono:     "+5025" + randomInt(1000000, 9999999),
    estado:       Math.random() > 0.08 ? "activo" : "inactivo",
    direccion_principal: {
      alias:           "Casa",
      direccion_texto: randomInt(1, 20) + " Calle " + randomInt(1, 30) + "-" + randomInt(10, 99) + ", " + zona,
      geo:             randomGeoGuatemala(),
    },
    direcciones: direccionesExtra,
    preferencias: {
      idioma:         "es",
      notificaciones: Math.random() > 0.3,
    },
    fecha_creacion:      randomDate(new Date("2022-01-01"), FECHA_FIN),
    fecha_actualizacion: randomDate(new Date("2025-01-01"), FECHA_FIN),
  });
}
bulkUsers.execute();
print("Usuarios totales: " + db.usuarios.countDocuments());


// --- BULK: 50,000 MENU ITEMS ---
use("restaurantes_db");
print("Generando 50,000 menu items...");
var idsRestaurantes = db.restaurantes.find({}, { _id: 1 }).toArray().map(function(r) { return r._id; });
var bulkMenu = db.menu_items.initializeUnorderedBulkOp();

for (var i = 1; i <= 50000; i++) {
  var plato     = randomFrom(PLATOS);
  var categoria = randomFrom(CATEGORIAS_MENU);
  var precio    = randomFloat(15.00, 250.00);

  var tags = [];
  var numTags = randomInt(2, 5);
  while (tags.length < numTags) {
    var tag = randomFrom(TAGS_POOL);
    if (tags.indexOf(tag) === -1) tags.push(tag);
  }

  var opciones = [];
  if (Math.random() > 0.5) {
    opciones.push({
      nombre: "Tamano",
      valores: [
        { nombre: "Regular",  incremento: 0 },
        { nombre: "Grande",   incremento: randomInt(10, 30) },
        { nombre: "Familiar", incremento: randomInt(30, 60) },
      ],
    });
  }
  if (Math.random() > 0.7) {
    opciones.push({
      nombre: "Extras",
      valores: [
        { nombre: "Sin extras",     incremento: 0 },
        { nombre: "Extra queso",    incremento: randomInt(5, 15) },
        { nombre: "Extra proteina", incremento: randomInt(10, 25) },
      ],
    });
  }

  bulkMenu.insert({
    restaurante_id:  randomFrom(idsRestaurantes),
    nombre:          plato + " " + randomFrom(VARIANTES_PLATO),
    descripcion:     "Delicioso " + plato.toLowerCase() + " preparado con ingredientes frescos, " + randomFrom(["receta tradicional","toque moderno","estilo artesanal","sabor autentico"]),
    categoria:       categoria,
    precio:          precio,
    moneda:          "GTQ",
    disponible:      Math.random() > 0.12,
    tags:            tags,
    imagenes: [{ url: IMAGENES_PLATOS[plato] || IMAGEN_DEFAULT, principal: true }],
    opciones:        opciones,
    metricas: { veces_pedido: randomInt(0, 2000) },
    fecha_creacion:      randomDate(new Date("2021-01-01"), new Date("2025-01-01")),
    fecha_actualizacion: randomDate(new Date("2025-01-01"), FECHA_FIN),
  });
}
bulkMenu.execute();
print("Menu items totales: " + db.menu_items.countDocuments());


// --- BULK: 50,000 ORDENES ---
use("restaurantes_db");
print("Generando 50,000 ordenes...");
var idsUsuarios  = db.usuarios.find({}, { _id: 1 }).toArray().map(function(u) { return u._id; });
var idsMenuItems = db.menu_items.find({}, { _id: 1, nombre: 1, precio: 1 }).limit(1000).toArray();
var bulkOrdenes  = db.ordenes.initializeUnorderedBulkOp();

for (var i = 1; i <= 50000; i++) {
  var estadoOrden = randomFrom(ESTADOS_ORDEN);
  var fechaBase   = randomDate(FECHA_INICIO, FECHA_FIN);
  var zona        = randomFrom(ZONAS_GT);

  var itemsOrden    = [];
  var subtotalTotal = 0;
  var numItems      = randomInt(1, 4);

  for (var j = 0; j < numItems; j++) {
    var menuRef  = randomFrom(idsMenuItems);
    var cantidad = randomInt(1, 3);
    var precio   = menuRef.precio || randomFloat(25, 150);
    var subtotal = parseFloat((precio * cantidad).toFixed(2));
    subtotalTotal += subtotal;
    itemsOrden.push({
      menu_item_id:             menuRef._id,
      nombre_snapshot:          menuRef.nombre || "Producto",
      precio_unitario_snapshot: precio,
      cantidad:                 cantidad,
      subtotal:                 subtotal,
    });
  }

  var costoEnvio = randomFrom([10, 15, 20, 25]);
  var descuento  = Math.random() > 0.85 ? randomFloat(5, 30) : 0;
  var total      = parseFloat((subtotalTotal + costoEnvio - descuento).toFixed(2));

  // El historial se construye segun el estado final de la orden
  var historial = [{ estado: "creada", fecha: fechaBase, usuario_evento: "sistema" }];
  if (estadoOrden !== "creada") {
    historial.push({ estado: "confirmada",     fecha: new Date(fechaBase.getTime() + 2*60000),  usuario_evento: "restaurante" });
  }
  if (["en_preparacion","en_camino","entregada"].indexOf(estadoOrden) !== -1) {
    historial.push({ estado: "en_preparacion", fecha: new Date(fechaBase.getTime() + 8*60000),  usuario_evento: "restaurante" });
  }
  if (["en_camino","entregada"].indexOf(estadoOrden) !== -1) {
    historial.push({ estado: "en_camino",      fecha: new Date(fechaBase.getTime() + 30*60000), usuario_evento: "repartidor" });
  }
  if (estadoOrden === "entregada") {
    historial.push({ estado: "entregada",      fecha: new Date(fechaBase.getTime() + 50*60000), usuario_evento: "sistema" });
  }
  if (estadoOrden === "cancelada") {
    historial.push({ estado: "cancelada",      fecha: new Date(fechaBase.getTime() + 3*60000),  usuario_evento: randomFrom(["usuario","restaurante"]) });
  }

  bulkOrdenes.insert({
    codigo_orden:    "ORD-" + String(i + 10000).padStart(6, "0"),
    usuario_id:      randomFrom(idsUsuarios),
    restaurante_id:  randomFrom(idsRestaurantes),
    estado_orden:    estadoOrden,
    notas_cliente:   Math.random() > 0.6 ? randomFrom(["Sin cebolla","Extra salsa","Sin picante","Bien cocido","Sin gluten si es posible",""]) : "",
    direccion_entrega: {
      alias:           randomFrom(["Casa","Trabajo","Universidad","Otro"]),
      direccion_texto: randomInt(1, 20) + " Av. " + randomInt(1, 30) + "-" + randomInt(10, 99) + ", " + zona,
      geo:             randomGeoGuatemala(),
    },
    items: itemsOrden,
    resumen_pago: {
      subtotal:    parseFloat(subtotalTotal.toFixed(2)),
      costo_envio: costoEnvio,
      descuento:   descuento,
      impuestos:   0,
      total:       total,
      metodo_pago: randomFrom(METODOS_PAGO),
      estado_pago: estadoOrden === "entregada" ? "pagado" : (estadoOrden === "cancelada" ? randomFrom(["pendiente","reembolsado"]) : "pendiente"),
    },
    historial_estados:   historial,
    fecha_creacion:      fechaBase,
    fecha_actualizacion: historial[historial.length - 1].fecha,
  });
}
bulkOrdenes.execute();
print("Ordenes totales: " + db.ordenes.countDocuments());


// --- BULK: 30,000 RESENAS ---
// Solo se crean resenas para ordenes entregadas, igual que en la vida real
use("restaurantes_db");
print("Generando 30,000 resenas...");
var ordenesEntregadas = db.ordenes
  .find({ estado_orden: "entregada" }, { _id: 1, usuario_id: 1, restaurante_id: 1 })
  .limit(30000)
  .toArray();

var bulkResenas = db.resenas.initializeUnorderedBulkOp();

for (var i = 0; i < Math.min(30000, ordenesEntregadas.length); i++) {
  var orden = ordenesEntregadas[i];

  // Las calificaciones tienen sesgo hacia arriba, como en apps reales
  var rnd = Math.random();
  var calificacion;
  if      (rnd < 0.45) calificacion = 5;
  else if (rnd < 0.70) calificacion = 4;
  else if (rnd < 0.85) calificacion = 3;
  else if (rnd < 0.95) calificacion = 2;
  else                  calificacion = 1;

  bulkResenas.insert({
    orden_id:       orden._id,
    usuario_id:     orden.usuario_id,
    restaurante_id: orden.restaurante_id,
    calificacion:   calificacion,
    comentario:     Math.random() > 0.25 ? randomFrom(COMENTARIOS) : "",
    aspectos: {
      sabor:          randomInt(Math.max(1, calificacion - 1), Math.min(5, calificacion + 1)),
      tiempo_entrega: randomInt(Math.max(1, calificacion - 1), Math.min(5, calificacion + 1)),
      presentacion:   randomInt(Math.max(1, calificacion - 1), Math.min(5, calificacion + 1)),
    },
    visible:        Math.random() > 0.03,
    fecha_creacion: randomDate(FECHA_INICIO, FECHA_FIN),
  });
}
bulkResenas.execute();
print("Resenas totales: " + db.resenas.countDocuments());


// =============================================================
// RESUMEN FINAL
// =============================================================
use("restaurantes_db");
print("\n--- RESUMEN FINAL ---");
print("usuarios     : " + db.usuarios.countDocuments());
print("restaurantes : " + db.restaurantes.countDocuments());
print("menu_items   : " + db.menu_items.countDocuments());
print("ordenes      : " + db.ordenes.countDocuments());
print("resenas      : " + db.resenas.countDocuments());
print("Script completado.");