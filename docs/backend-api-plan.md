# Backend API — Plan de Implementacion

## Arquitectura

Express.js REST API independiente, Node.js plain JavaScript (sin TypeScript).
El frontend Next.js consume la API via HTTP.

```
Browser
  |
Next.js  (puerto 3000)  <-->  Express API (puerto 4000)
                                     |
                               MongoDB Atlas
                               restaurantes_db
```

---

## Estructura de archivos

```
backend-api/
├── .env                        # MONGODB_URI, PORT
├── package.json
├── server.js                   # Entry point, registra rutas y middleware
├── lib/
│   └── mongodb.js              # Singleton MongoClient
└── routes/
    ├── restaurantes.js
    ├── usuarios.js
    ├── menu-items.js
    ├── ordenes.js
    ├── resenas.js
    ├── uploads.js              # GridFS — unico endpoint de archivos
    └── analytics.js
```

---

## Dependencias

```bash
npm install express mongodb dotenv cors multer
```

- `express` — servidor HTTP
- `mongodb` — driver oficial (mismo usado en los scripts mongosh)
- `dotenv` — variables de entorno
- `cors` — cabeceras CORS para el frontend
- `multer` — parsear multipart/form-data antes de pasar el stream a GridFS

---

## Variables de entorno (.env)

```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/restaurantes_db?retryWrites=true&w=majority
PORT=4000
```

---

## Rubrica vs implementacion

Todos los endpoints exponen logica ya existente en los scripts mongosh.
No se inventa nada nuevo; solo se conecta lo que ya funciona al HTTP layer.

### CRUD — CREATE (10 pts)
Crea documentos embebidos y referenciados tal como estan en crud.mongodb.js.

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/usuarios | Inserta un usuario con direccion_principal y direcciones embebidas |
| POST | /api/restaurantes | Inserta un restaurante con horarios y estadisticas embebidas |
| POST | /api/menu-items | Inserta uno o varios items referenciados por restaurante_id |
| POST | /api/ordenes | TX ACID: valida items, embebe snapshot de precios, actualiza estadisticas del restaurante via bulkWrite |
| POST | /api/resenas | TX ACID: verifica orden entregada, crea resena, recalcula rating del restaurante |

La logica de las dos transacciones ACID viene directamente de `operations.mongodb.js`:
`createOrderTransactional` y `publishReviewTransactional`.

---

### CRUD — READ (15 pts)
Lookups multi-coleccion, filtros, proyecciones, sort, skip, limit.

| Metodo | Ruta | Capacidades |
|--------|------|-------------|
| GET | /api/restaurantes | filtro estado/categoria, sort por rating, skip+limit (paginacion) |
| GET | /api/restaurantes/:id | proyeccion de campos, lookup opcional a menu_items |
| GET | /api/restaurantes?lat=&lng=&maxKm= | busqueda geoespacial $near (usa idx_restaurantes_ubicacion_geo_2dsphere) |
| GET | /api/restaurantes?q= | busqueda de texto $text (usa idx_menu_items_text_search en menu_items) |
| GET | /api/menu-items | filtro por restaurante_id, disponible, categoria; sort precio; skip+limit |
| GET | /api/menu-items?tags= | filtro por tag (array → multikey idx_menu_items_tags) |
| GET | /api/usuarios/:id | proyeccion de perfil completo |
| GET | /api/ordenes | filtro por usuario_id o restaurante_id; sort fecha; skip+limit |
| GET | /api/ordenes/:id | lookup a usuarios y restaurantes (igual que READ 2 de crud.mongodb.js) |
| GET | /api/resenas | filtro por restaurante_id, visible; sort calificacion; skip+limit |
| GET | /api/resenas?restaurante_id= | lookup a usuarios (igual que READ 5 de crud.mongodb.js) |

---

### CRUD — UPDATE (10 pts)
updateOne y updateMany sobre documentos reales.

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| PUT | /api/usuarios/:id | updateOne: telefono, preferencias.notificaciones, fecha_actualizacion |
| PUT | /api/restaurantes/:id | updateOne: nombre, estado, contacto |
| PUT | /api/menu-items/:id | updateOne: precio, disponible, fecha_actualizacion |
| PATCH | /api/ordenes/:id | updateOne: estado_orden, $push a historial_estados (con fecha del evento) |
| PATCH | /api/menu-items/bulk-disable | updateMany: deshabilitar items sin ventas (metricas.veces_pedido < umbral) |
| PATCH | /api/menu-items/bulk-price | updateMany: ajuste de precio por categoria (pipeline update con $multiply) |

---

### CRUD — DELETE (10 pts)
deleteOne y deleteMany.

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| DELETE | /api/menu-items/:id | deleteOne por _id |
| DELETE | /api/usuarios/inactive | deleteMany: usuarios inactivos sin ordenes (igual que DELETE 2 de crud.mongodb.js) |

---

### Manejo de Arrays (10 pts)
Operaciones $push, $pull, $addToSet sobre arrays reales del schema.

| Metodo | Ruta | Operacion |
|--------|------|-----------|
| POST | /api/usuarios/:id/direcciones | $push nueva direccion al array direcciones |
| DELETE | /api/usuarios/:id/direcciones/:alias | $pull direccion por alias del array direcciones |
| POST | /api/menu-items/:id/tags | $addToSet un tag al array tags (no duplica) |
| DELETE | /api/menu-items/:id/tags/:tag | $pull un tag especifico del array tags |
| POST | /api/restaurantes/:id/categorias | $addToSet categoria al array categorias |

El array historial_estados de ordenes se actualiza via PATCH /api/ordenes/:id con $push.

---

### Documentos embebidos (5 pts)
Se trabajan dentro de los endpoints existentes, no necesitan ruta propia.

- Actualizacion de `direccion_principal` (embedded en usuarios) via PUT /api/usuarios/:id
- Actualizacion de `estadisticas` (embedded en restaurantes) via TX de ordenes y resenas
- Lectura de `aspectos` (embedded en resenas) via GET /api/resenas
- Snapshot de precios en `items` (embedded en ordenes) via POST /api/ordenes

---

### Agregaciones simples (5 pts)
count, distinct y equivalentes. Se exponen como sub-rutas de stats.

| Metodo | Ruta | Operacion MongoDB |
|--------|------|-------------------|
| GET | /api/restaurantes/stats/count | countDocuments({ estado: "activo" }) |
| GET | /api/ordenes/stats/count | countDocuments por estado_orden |
| GET | /api/menu-items/stats/count | countDocuments({ disponible: true }) |
| GET | /api/restaurantes/stats/categorias | distinct("categoria_principal") |
| GET | /api/ordenes/stats/metodos-pago | distinct("resumen_pago.metodo_pago") |
| GET | /api/ordenes/stats/estados | distinct("estado_orden") |

---

### Agregaciones complejas (10 pts)
Los 5 pipelines de `operations.mongodb.js` se exponen como endpoints de analytics.

| Metodo | Ruta | Funcion origen |
|--------|------|----------------|
| GET | /api/analytics/ventas-por-mes | salesByRestaurantMonth(params) |
| GET | /api/analytics/top-productos | topProductsByRestaurant(params) |
| GET | /api/analytics/ratings | restaurantRatings(params) |
| GET | /api/analytics/funnel-ordenes | orderFunnel(params) |
| GET | /api/analytics/tiempos-estado | orderStateTimes(params) |

Query params opcionales: `restaurante_id`, `startDate`, `endDate`, `limit`.

---

### GridFS y archivos (5 pts)
Unico criterio que no existia en los scripts. Se agrega en `routes/uploads.js`.

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/uploads | Sube un archivo (imagen) via multipart/form-data y lo guarda en GridFS |
| GET | /api/uploads/:fileId | Recupera y sirve el archivo desde GridFS por su ObjectId |
| DELETE | /api/uploads/:fileId | Elimina el archivo de GridFS (fs.files + fs.chunks) |

Flujo de uso:
1. Cliente sube imagen de restaurante o menu_item via POST /api/uploads
2. La API devuelve el `fileId` del GridFS
3. El cliente guarda ese `fileId` en el campo `imagenes` del restaurante o menu_item
4. Para servir la imagen, usa GET /api/uploads/:fileId

Implementacion: `mongodb.GridFSBucket` del driver oficial. Se usa `multer` con
`memoryStorage()` para recibir el buffer y luego escribirlo al bucket con
`bucket.openUploadStream()`.

---

### Extra — bulkWrite (5 pts)
Ya implementado en `operations.mongodb.js` dentro de `createOrderTransactional`:
cuando se crea una orden, se actualiza `metricas.veces_pedido` de cada menu_item
pedido usando `menuItemsCol.bulkWrite(bulkOps, { ordered: false })`.

Se expone implicitamente en `POST /api/ordenes`. No se necesita endpoint adicional.

---

## Indices en uso

Los 9 indices creados por `03_indexes.mongodb.js` se usan automaticamente:

| Indice | Usado en |
|--------|----------|
| idx_ordenes_usuario_id | GET /api/ordenes?usuario_id= |
| idx_ordenes_rest_estado_fecha | GET /api/ordenes?restaurante_id= + PATCH estado |
| idx_menu_items_tags | GET /api/menu-items?tags= |
| idx_restaurantes_ubicacion_geo_2dsphere | GET /api/restaurantes?lat=&lng= |
| idx_menu_items_text_search | GET /api/restaurantes?q= (busqueda en menu) |
| idx_resenas_restaurante_fecha | GET /api/resenas?restaurante_id= |
| idx_ordenes_fecha_creacion | GET /api/analytics/* (pipelines por fecha) |
| idx_menu_items_rest_disponible_categoria | GET /api/menu-items?restaurante_id=&categoria= |
| uq_resenas_orden_id | POST /api/resenas (unico por orden, garantizado por indice) |

---

## Convencion de respuestas

```js
// Lista paginada
{ data: [...], meta: { total, page, limit } }

// Documento unico
{ data: { ... } }

// Creacion exitosa
{ data: { insertedId: "..." } }    // HTTP 201

// Error
{ error: "mensaje descriptivo" }   // HTTP 400 / 404 / 500
```

---

## Lo que NO cambia

- Los scripts `backend/*.mongodb.js` son la fuente de verdad. No se modifican.
- Los 9 indices estan creados en Atlas y se aprovechan automaticamente.
- Las transacciones ACID se portan tal cual desde `operations.mongodb.js`,
  usando `session.withTransaction()` del driver oficial de Node.js.
- El bulk de datos (155,000 documentos) ya existe en Atlas desde `setup_db.mongodb.js`.
