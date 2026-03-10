// =============================================================
// PROYECTO 1 - BD2 | CRUD Completo
// Todas las operaciones CRUD sobre datos reales
// Los documentos creados se dejan en la DB para demostrar que las operaciones afectan el cluster real.
// =============================================================

use("restaurantes_db");

// =============================================================
// SECCION 1: CREATE
// Creacion de documentos embebidos y referenciados
// =============================================================

print("CREATE");

// CREATE 1: Insertar UN usuario (documento con campos embebidos)
// Embedded: direccion_principal, direcciones, preferencias
const nuevoUsuario = db.usuarios.insertOne({
  tipo_usuario: "cliente",
  nombre: "Ana Martinez CRUD",
  email: "ana.martinez.crud@bd2proyecto.com",
  telefono: "+50299990001",
  estado: "activo",
  direccion_principal: {
    alias: "Casa",
    direccion_texto: "Zona 5, Guatemala",
    geo: { type: "Point", coordinates: [-90.5300, 14.6100] },
  },
  direcciones: [
    {
      alias: "Trabajo",
      direccion_texto: "Zona 9, Guatemala",
      geo: { type: "Point", coordinates: [-90.5200, 14.6050] },
    },
  ],
  preferencias: { idioma: "es", notificaciones: true },
  fecha_creacion: new Date(),
  fecha_actualizacion: new Date(),
});

const nuevoUsuarioId = nuevoUsuario.insertedId;
print("Usuario creado con _id: " + nuevoUsuarioId);

// CREATE 2: Insertar UN restaurante (documento con campos embebidos)
const nuevoRestaurante = db.restaurantes.insertOne({
  nombre: "Tacos El Buen Sabor CRUD",
  slug: "tacos-el-buen-sabor-crud",
  categoria_principal: "Mexicana",
  categorias: ["Mexicana", "Tacos", "Comida rapida"],
  descripcion: "Los mejores tacos de Guatemala, receta autentica mexicana",
  estado: "activo",
  contacto: {
    telefono: "+50244441111",
    email: "info@tacoselbuensabor.gt",
  },
  ubicacion: {
    direccion_texto: "5a Avenida 8-23, Zona 1",
    geo: { type: "Point", coordinates: [-90.5140, 14.6420] },
  },
  horarios: [
    { dia: "Lunes",    apertura: "10:00", cierre: "22:00" },
    { dia: "Martes",   apertura: "10:00", cierre: "22:00" },
    { dia: "Miercoles",apertura: "10:00", cierre: "22:00" },
    { dia: "Jueves",   apertura: "10:00", cierre: "23:00" },
    { dia: "Viernes",  apertura: "10:00", cierre: "23:00" },
    { dia: "Sabado",   apertura: "11:00", cierre: "23:00" },
    { dia: "Domingo",  apertura: "11:00", cierre: "21:00" },
  ],
  estadisticas: {
    rating_promedio: 0,
    total_resenas: 0,
    total_ordenes: 0,
  },
  fecha_creacion: new Date(),
  fecha_actualizacion: new Date(),
});

const nuevoRestauranteId = nuevoRestaurante.insertedId;
print("Restaurante creado con _id: " + nuevoRestauranteId);

// CREATE 3: Insertar VARIOS menu items (referenciados al restaurante nuevo)
// Referenced: restaurante_id apunta al restaurante recien creado
const nuevosMenuItems = db.menu_items.insertMany([
  {
    restaurante_id: nuevoRestauranteId,
    nombre: "Taco de Carnitas CRUD",
    descripcion: "Taco de carnitas con cilantro, cebolla y salsa verde",
    categoria: "Tacos",
    precio: 25.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["tacos", "carnitas", "mexicano", "picante"],
    imagenes: [{ url: "https://plus.unsplash.com/premium_photo-1672976349009-918d041258aa?q=80&w=988", principal: true }],
    opciones: [
      {
        nombre: "Salsa",
        valores: [
          { nombre: "Verde",  incremento: 0 },
          { nombre: "Roja",   incremento: 0 },
          { nombre: "Habanero", incremento: 5 },
        ],
      },
    ],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
  },
  {
    restaurante_id: nuevoRestauranteId,
    nombre: "Burrito de Pollo CRUD",
    descripcion: "Burrito relleno de pollo, frijoles, arroz y guacamole",
    categoria: "Burritos",
    precio: 45.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["burrito", "pollo", "mexicano", "saludable"],
    imagenes: [{ url: "https://images.unsplash.com/photo-1562059390-a761a084768e?q=80&w=1419", principal: true }],
    opciones: [],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
  },
  {
    restaurante_id: nuevoRestauranteId,
    nombre: "Quesadilla de Queso CRUD",
    descripcion: "Quesadilla con queso Oaxaca derretido y chile poblano",
    categoria: "Quesadillas",
    precio: 35.00,
    moneda: "GTQ",
    disponible: true,
    tags: ["quesadilla", "queso", "vegetariano", "mexicano"],
    imagenes: [{ url: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?q=80&w=1470", principal: true }],
    opciones: [],
    metricas: { veces_pedido: 0 },
    fecha_creacion: new Date(),
    fecha_actualizacion: new Date(),
  },
]);

const nuevoItemId = nuevosMenuItems.insertedIds[0];
print("Menu items creados: " + nuevosMenuItems.insertedCount);

// CREATE 4: Insertar UNA orden (referenciada + items embebidos con snapshot)
// Referenced: usuario_id y restaurante_id
// Embedded: items con snapshot de precio, direccion_entrega, historial_estados
const nuevaOrden = db.ordenes.insertOne({
  codigo_orden: "ORD-CRUD-000001",
  usuario_id: nuevoUsuarioId,
  restaurante_id: nuevoRestauranteId,
  estado_orden: "entregada",
  notas_cliente: "Extra salsa verde por favor",
  direccion_entrega: {
    alias: "Casa",
    direccion_texto: "Zona 5, Guatemala",
    geo: { type: "Point", coordinates: [-90.5300, 14.6100] },
  },
  items: [
    {
      menu_item_id: nuevoItemId,
      nombre_snapshot: "Taco de Carnitas CRUD",
      precio_unitario_snapshot: 25.00,
      cantidad: 3,
      subtotal: 75.00,
    },
  ],
  resumen_pago: {
    subtotal: 75.00,
    costo_envio: 15.00,
    descuento: 0,
    impuestos: 0,
    total: 90.00,
    metodo_pago: "tarjeta",
    estado_pago: "pagado",
  },
  historial_estados: [
    { estado: "creada",         fecha: new Date("2026-03-01T12:00:00Z"), usuario_evento: "sistema" },
    { estado: "confirmada",     fecha: new Date("2026-03-01T12:02:00Z"), usuario_evento: "restaurante" },
    { estado: "en_preparacion", fecha: new Date("2026-03-01T12:10:00Z"), usuario_evento: "restaurante" },
    { estado: "en_camino",      fecha: new Date("2026-03-01T12:35:00Z"), usuario_evento: "repartidor" },
    { estado: "entregada",      fecha: new Date("2026-03-01T12:55:00Z"), usuario_evento: "sistema" },
  ],
  fecha_creacion: new Date("2026-03-01T12:00:00Z"),
  fecha_actualizacion: new Date("2026-03-01T12:55:00Z"),
});

const nuevaOrdenId = nuevaOrden.insertedId;
print("Orden creada con _id: " + nuevaOrdenId);

// CREATE 5: Insertar UNA resena (referenciada a orden, usuario y restaurante)
const nuevaResena = db.resenas.insertOne({
  orden_id: nuevaOrdenId,
  usuario_id: nuevoUsuarioId,
  restaurante_id: nuevoRestauranteId,
  calificacion: 5,
  comentario: "Excelentes tacos, muy autenticos y llegaron rapido!",
  aspectos: {
    sabor: 5,
    tiempo_entrega: 5,
    presentacion: 4,
  },
  visible: true,
  fecha_creacion: new Date(),
});

print("Resena creada con _id: " + nuevaResena.insertedId);

print("\nCREATE completado.");
print("usuarios:     " + db.usuarios.countDocuments());
print("restaurantes: " + db.restaurantes.countDocuments());
print("menu_items:   " + db.menu_items.countDocuments());
print("ordenes:      " + db.ordenes.countDocuments());
print("resenas:      " + db.resenas.countDocuments());


// =============================================================
// SECCION 2: READ
// Lectura con lookup, filtros, proyecciones, sort, skip, limit
// =============================================================

print("READ");

// READ 1: Listar restaurantes activos con filtro, proyeccion, sort, skip y limit
print("\nREAD 1: Restaurantes activos ordenados por rating (pagina 2, 5 por pagina):");
const restaurantesPag = db.restaurantes
  .find(
    { estado: "activo" },
    {
      _id: 0,
      nombre: 1,
      categoria_principal: 1,
      "estadisticas.rating_promedio": 1,
    }
  )
  .sort({ "estadisticas.rating_promedio": -1 })
  .skip(5)
  .limit(5);
restaurantesPag.forEach(function(r) { printjson(r); });

// READ 2: Lookup - ordenes con datos del usuario y restaurante
print("\nREAD 2: Ordenes entregadas con datos de usuario y restaurante (lookup):");
const ordenesConDatos = db.ordenes.aggregate([
  { $match: { estado_orden: "entregada" } },
  {
    $lookup: {
      from: "usuarios",
      localField: "usuario_id",
      foreignField: "_id",
      as: "usuario",
    },
  },
  {
    $lookup: {
      from: "restaurantes",
      localField: "restaurante_id",
      foreignField: "_id",
      as: "restaurante",
    },
  },
  { $unwind: "$usuario" },
  { $unwind: "$restaurante" },
  {
    $project: {
      _id: 0,
      codigo_orden: 1,
      estado_orden: 1,
      "resumen_pago.total": 1,
      "usuario.nombre": 1,
      "usuario.email": 1,
      "restaurante.nombre": 1,
    },
  },
  { $sort: { "resumen_pago.total": -1 } },
  { $skip: 0 },
  { $limit: 5 },
]);
ordenesConDatos.forEach(function(o) { printjson(o); });

// READ 3: Menu items disponibles con filtro por tags y proyeccion
print("\nREAD 3: Menu items con tag 'picante' disponibles:");
const menuPicante = db.menu_items
  .find(
    { tags: "picante", disponible: true },
    { _id: 0, nombre: 1, precio: 1, categoria: 1, tags: 1 }
  )
  .sort({ precio: 1 })
  .skip(0)
  .limit(10);
menuPicante.forEach(function(m) { printjson(m); });

// READ 4: Usuarios activos con filtro, proyeccion, sort, skip, limit
print("\nREAD 4: Usuarios activos (pagina 1, 5 resultados):");
const usuariosActivos = db.usuarios
  .find(
    { estado: "activo", tipo_usuario: "cliente" },
    { _id: 0, nombre: 1, email: 1, tipo_usuario: 1 }
  )
  .sort({ fecha_creacion: -1 })
  .skip(0)
  .limit(5);
usuariosActivos.forEach(function(u) { printjson(u); });

// READ 5: Resenas visibles de un restaurante con lookup al usuario
print("\nREAD 5: Resenas visibles con datos del usuario (lookup):");
const resenasConUsuario = db.resenas.aggregate([
  { $match: { visible: true } },
  {
    $lookup: {
      from: "usuarios",
      localField: "usuario_id",
      foreignField: "_id",
      as: "usuario",
    },
  },
  { $unwind: "$usuario" },
  {
    $project: {
      _id: 0,
      calificacion: 1,
      comentario: 1,
      "aspectos.sabor": 1,
      "usuario.nombre": 1,
      fecha_creacion: 1,
    },
  },
  { $sort: { calificacion: -1 } },
  { $skip: 0 },
  { $limit: 5 },
]);
resenasConUsuario.forEach(function(r) { printjson(r); });

print("\nREAD completado.");


// =============================================================
// SECCION 3: UPDATE
// Actualizar 1 documento y varios documentos
// =============================================================

print("UPDATE");

// UPDATE 1: Actualizar UN documento - cambiar telefono y notificaciones del usuario creado
const updateUno = db.usuarios.updateOne(
  { _id: nuevoUsuarioId },
  {
    $set: {
      telefono: "+50299990002",
      "preferencias.notificaciones": false,
      fecha_actualizacion: new Date(),
    },
  }
);
print("UPDATE 1 (un usuario): matchedCount=" + updateUno.matchedCount + ", modifiedCount=" + updateUno.modifiedCount);

// UPDATE 2: Actualizar UN menu item - cambiar precio y disponibilidad
const updateMenuItem = db.menu_items.updateOne(
  { _id: nuevoItemId },
  {
    $set: {
      precio: 28.00,
      disponible: true,
      fecha_actualizacion: new Date(),
    },
  }
);
print("UPDATE 2 (un menu item): matchedCount=" + updateMenuItem.matchedCount + ", modifiedCount=" + updateMenuItem.modifiedCount);

// UPDATE 3: Actualizar VARIOS documentos - marcar como inactivos menu items sin ventas
const updateVarios = db.menu_items.updateMany(
  {
    "metricas.veces_pedido": { $lt: 5 },
    disponible: true,
    restaurante_id: nuevoRestauranteId,
  },
  {
    $set: {
      disponible: false,
      fecha_actualizacion: new Date(),
    },
  }
);
print("UPDATE 3 (varios menu items sin ventas): matchedCount=" + updateVarios.matchedCount + ", modifiedCount=" + updateVarios.modifiedCount);

// UPDATE 4: Actualizar VARIOS - subir precio 5% a todos los items de categoria Tacos
const updatePreciosTacos = db.menu_items.updateMany(
  { categoria: "Tacos", disponible: true },
  [
    {
      $set: {
        precio: { $round: [{ $multiply: ["$precio", 1.05] }, 2] },
        fecha_actualizacion: new Date(),
      },
    },
  ]
);
print("UPDATE 4 (subir precio tacos 5%): matchedCount=" + updatePreciosTacos.matchedCount + ", modifiedCount=" + updatePreciosTacos.modifiedCount);

print("\nUPDATE completado.");


// =============================================================
// SECCION 4: MANEJO DE ARRAYS
// $push, $pull, $addToSet sobre documentos reales
// =============================================================

print("MANEJO DE ARRAYS");

// ARRAY 1: $push - agregar una nueva direccion al usuario creado
const pushDireccion = db.usuarios.updateOne(
  { _id: nuevoUsuarioId },
  {
    $push: {
      direcciones: {
        alias: "Gym",
        direccion_texto: "Zona 10, Guatemala",
        geo: { type: "Point", coordinates: [-90.5100, 14.6000] },
      },
    },
    $set: { fecha_actualizacion: new Date() },
  }
);
print("ARRAY $push (nueva direccion): modifiedCount=" + pushDireccion.modifiedCount);

// ARRAY 2: $pull - quitar el tag 'picante' de todos los tacos del restaurante nuevo
const pullTag = db.menu_items.updateMany(
  { restaurante_id: nuevoRestauranteId, tags: "picante" },
  {
    $pull: { tags: "picante" },
    $set: { fecha_actualizacion: new Date() },
  }
);
print("ARRAY $pull (quitar tag picante): modifiedCount=" + pullTag.modifiedCount);

// ARRAY 3: $addToSet - agregar tag 'nuevo' solo si no existe (evita duplicados)
const addToSetTag = db.menu_items.updateMany(
  { restaurante_id: nuevoRestauranteId },
  {
    $addToSet: { tags: "nuevo" },
    $set: { fecha_actualizacion: new Date() },
  }
);
print("ARRAY $addToSet (agregar tag nuevo): modifiedCount=" + addToSetTag.modifiedCount);

// ARRAY 4: $push - agregar nuevo estado al historial de la orden creada
const pushHistorial = db.ordenes.updateOne(
  { _id: nuevaOrdenId },
  {
    $push: {
      historial_estados: {
        estado: "reseña_recibida",
        fecha: new Date(),
        usuario_evento: "sistema",
      },
    },
    $set: { fecha_actualizacion: new Date() },
  }
);
print("ARRAY $push (nuevo estado en historial): modifiedCount=" + pushHistorial.modifiedCount);

// ARRAY 5: $addToSet - agregar categoria a restaurante sin duplicar
const addCategoria = db.restaurantes.updateOne(
  { _id: nuevoRestauranteId },
  {
    $addToSet: { categorias: "Fusion" },
    $set: { fecha_actualizacion: new Date() },
  }
);
print("ARRAY $addToSet (nueva categoria restaurante): modifiedCount=" + addCategoria.modifiedCount);

print("\nMANEJO DE ARRAYS completado.");


// =============================================================
// SECCION 5: AGREGACIONES SIMPLES
// count, distinct y otras operaciones simples
// =============================================================

print("\n--- AGREGACIONES SIMPLES ---");

// SIMPLE 1: countDocuments - total de usuarios activos
const totalUsuariosActivos = db.usuarios.countDocuments({ estado: "activo" });
print("Total usuarios activos: " + totalUsuariosActivos);

// SIMPLE 2: countDocuments - total de ordenes entregadas
const totalOrdenesEntregadas = db.ordenes.countDocuments({ estado_orden: "entregada" });
print("Total ordenes entregadas: " + totalOrdenesEntregadas);

// SIMPLE 3: countDocuments - menu items disponibles
const totalMenuDisponible = db.menu_items.countDocuments({ disponible: true });
print("Total menu items disponibles: " + totalMenuDisponible);

// SIMPLE 4: distinct - categorias unicas de restaurantes
const categoriasUnicas = db.restaurantes.distinct("categoria_principal");
print("Categorias unicas de restaurantes (" + categoriasUnicas.length + "): " + categoriasUnicas.join(", "));

// SIMPLE 5: distinct - metodos de pago usados en ordenes
const metodosPago = db.ordenes.distinct("resumen_pago.metodo_pago");
print("Metodos de pago distintos: " + metodosPago.join(", "));

// SIMPLE 6: distinct - estados de orden existentes
const estadosOrden = db.ordenes.distinct("estado_orden");
print("Estados de orden distintos: " + estadosOrden.join(", "));

// SIMPLE 7: countDocuments con rango de fechas
const ordenesMes = db.ordenes.countDocuments({
  fecha_creacion: {
    $gte: new Date("2026-01-01T00:00:00Z"),
    $lte: new Date("2026-12-31T23:59:59Z"),
  },
});
print("Ordenes creadas en 2026: " + ordenesMes);

// SIMPLE 8: countDocuments - resenas con calificacion perfecta
const resenasPerfectas = db.resenas.countDocuments({ calificacion: 5 });
print("Resenas con calificacion 5: " + resenasPerfectas);

print("\nAGREGACIONES SIMPLES completadas.");


// =============================================================
// SECCION 6: DELETE
// Eliminar 1 documento y varios documentos
// =============================================================

print("DELETE");

// DELETE 1: Eliminar UN documento - borrar el menu item de Quesadilla creado
const menuItemQuesadilla = db.menu_items.findOne({
  restaurante_id: nuevoRestauranteId,
  nombre: "Quesadilla de Queso CRUD",
});

if (menuItemQuesadilla) {
  const deleteUno = db.menu_items.deleteOne({ _id: menuItemQuesadilla._id });
  print("DELETE 1 (un menu item - Quesadilla): deletedCount=" + deleteUno.deletedCount);
} else {
  print("DELETE 1: Quesadilla no encontrada (puede que ya fue borrada).");
}

// DELETE 2: Eliminar VARIOS documentos - borrar usuarios inactivos creados en 2026 que no tienen ordenes
// Primero identificamos quienes tienen ordenes
const usuariosConOrdenes = db.ordenes.distinct("usuario_id");

const deleteVarios = db.usuarios.deleteMany({
  estado: "inactivo",
  fecha_creacion: { $gte: new Date("2026-01-01T00:00:00Z") },
  _id: { $nin: usuariosConOrdenes },
});
print("DELETE 2 (varios usuarios inactivos sin ordenes de 2026): deletedCount=" + deleteVarios.deletedCount);

print("\nDELETE completado.");


// =============================================================
// RESUMEN FINAL
// =============================================================

print("\n=== RESUMEN FINAL CRUD ===");
print("usuarios:     " + db.usuarios.countDocuments());
print("restaurantes: " + db.restaurantes.countDocuments());
print("menu_items:   " + db.menu_items.countDocuments());
print("ordenes:      " + db.ordenes.countDocuments());
print("resenas:      " + db.resenas.countDocuments());
print("\nDocumentos CRUD que quedaron en la DB:");
print("- Usuario: " + nuevoUsuarioId);
print("- Restaurante: " + nuevoRestauranteId);
print("- Orden: " + nuevaOrdenId);
print("- Resena: " + nuevaResena.insertedId);
print("\n=== FIN CRUD COMPLETO ===");
