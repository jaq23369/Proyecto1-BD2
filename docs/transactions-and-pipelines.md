# Proyecto 1 BD2 - Transacciones y Aggregation Pipelines

## Contexto de ejecución en este repositorio
Este repositorio usa backend basado en scripts `mongosh` (no hay servidor REST en `backend/`).
Por esa razón, los casos de uso se exponen como funciones invocables desde `mongosh` en:

- `backend/operations.mongodb.js`

Carga recomendada en mongosh:

```javascript
load("backend/setup_db.mongodb.js");
load("backend/operations.mongodb.js");
```

---

## SECCIÓN A: Transacciones implementadas

### TX-01 Crear orden + actualizar métricas
- **Propósito**: crear una orden con snapshot histórico de items y actualizar métricas relacionadas de forma atómica.
- **Colección principal**: `ordenes`.
- **Colecciones afectadas**: `ordenes`, `restaurantes`, `menu_items`.
- **Función**: `backendOperations.transactions.createOrderTransactional(payload)`.

#### Secuencia
1. Valida entrada (`usuario_id`, `restaurante_id`, `items`, cantidades y montos).
2. Valida que el restaurante exista y esté activo.
3. Valida que cada `menu_item` exista, pertenezca al restaurante y esté disponible.
4. Construye `ordenes.items[]` embebido con snapshot:
   - `menu_item_id`
   - `nombre_snapshot`
   - `precio_unitario_snapshot`
   - `cantidad`
   - `subtotal`
   - `opciones_seleccionadas`
5. Calcula `resumen_pago` (`subtotal`, `costo_envio`, `descuento`, `impuestos`, `total`, `metodo_pago`, `estado_pago`).
6. Inserta la orden con `estado_orden = "creada"` e `historial_estados[]` inicial.
7. Incrementa `restaurantes.estadisticas.total_ordenes`.
8. Incrementa `menu_items.metricas.veces_pedido` con `bulkWrite`.
9. Confirma todo con `session.withTransaction`.

#### Por qué requiere atomicidad multidocumento
Si una parte falla (por ejemplo, se inserta la orden pero no se actualizan métricas), el sistema queda inconsistente entre colecciones. La transacción evita estados parciales y protege la coherencia de negocio entre orden creada y contadores asociados.

#### Riesgos evitados
- Orden creada sin reflejo en `estadisticas.total_ordenes`.
- Métricas de `menu_items` desalineadas con ventas reales.
- Snapshot incompleto o inconsistente frente al resumen de pago.

#### Ejemplo de uso
```javascript
backendOperations.transactions.createOrderTransactional({
  usuario_id: "<ObjectId usuario>",
  restaurante_id: "<ObjectId restaurante>",
  metodo_pago: "tarjeta",
  estado_pago: "pendiente",
  costo_envio: 15,
  descuento: 0,
  impuestos: 0,
  notas_cliente: "Sin cebolla",
  direccion_entrega: {
    alias: "Casa",
    direccion_texto: "Zona 10, Guatemala",
    geo: { type: "Point", coordinates: [-90.51, 14.60] }
  },
  items: [
    {
      menu_item_id: "<ObjectId menu_item>",
      cantidad: 2,
      opciones_seleccionadas: [{ nombre: "Tamano", valor: "Familiar" }]
    }
  ]
});
```

---

### TX-02 Publicar reseña + actualizar rating del restaurante
- **Propósito**: registrar una reseña válida y recalcular estadísticas de rating del restaurante en una sola unidad atómica.
- **Colección principal**: `resenas`.
- **Colecciones afectadas**: `resenas`, `restaurantes`, `ordenes` (lectura de validación).
- **Función**: `backendOperations.transactions.publishReviewTransactional(payload)`.

#### Secuencia
1. Valida entrada (`orden_id`, `usuario_id`, `calificacion`, `aspectos`).
2. Verifica que la orden exista.
3. Verifica pertenencia de la orden al usuario.
4. Verifica que la orden esté `entregada`.
5. Evita duplicado de reseña por orden.
6. Inserta la reseña en `resenas`.
7. Recalcula `rating_promedio` y `total_resenas` visibles por restaurante usando agregación.
8. Actualiza `restaurantes.estadisticas.rating_promedio` y `restaurantes.estadisticas.total_resenas`.
9. Confirma con `session.withTransaction`.

#### Por qué requiere atomicidad multidocumento
La publicación de reseña y la actualización del rating agregado deben ocurrir juntas. Si se registra una reseña y falla el update del restaurante, el rating expuesto queda obsoleto y no refleja el estado real de `resenas`.

#### Riesgos evitados
- Reseñas insertadas sin impacto en rating mostrado.
- `total_resenas` desfasado frente a las reseñas existentes.
- Inconsistencia entre detalle transaccional (reseña) y resumen agregado (estadísticas del restaurante).

#### Ejemplo de uso
```javascript
backendOperations.transactions.publishReviewTransactional({
  orden_id: "<ObjectId orden>",
  usuario_id: "<ObjectId usuario>",
  calificacion: 5,
  comentario: "Excelente servicio",
  visible: true,
  aspectos: {
    sabor: 5,
    tiempo_entrega: 4,
    presentacion: 5
  }
});
```

---

## SECCIÓN B: Aggregation pipelines implementados

### Pipeline 1: Ventas por restaurante por mes
- **Objetivo de negocio**: medir ingresos mensuales y ticket promedio por restaurante.
- **Colección fuente**: `ordenes`.
- **Función**: `backendOperations.analytics.salesByRestaurantMonth(params)`.
- **Filtros soportados**: `startDate`, `endDate`, `restaurante_id`.

#### Etapas
1. `$match` por `estado_orden = "entregada"` y filtros opcionales.
2. `$addFields` para construir `anio_mes` con `fecha_creacion`.
3. `$group` por `restaurante_id + anio_mes` calculando:
   - `total_ventas` (`$sum`)
   - `total_ordenes` (`$sum`)
   - `ticket_promedio` (`$avg`)
4. `$lookup` con `restaurantes` para nombre.
5. `$project` final para salida limpia.
6. `$sort` por mes y ventas.

#### Ejemplo de salida
```json
[
  {
    "restaurante_id": "...",
    "anio_mes": "2026-02",
    "restaurante_nombre": "Pizza Central",
    "total_ventas": 15234.5,
    "total_ordenes": 148,
    "ticket_promedio": 102.94
  }
]
```

---

### Pipeline 2: Top productos más vendidos por restaurante
- **Objetivo de negocio**: identificar demanda por producto.
- **Colección fuente**: `ordenes`.
- **Función**: `backendOperations.analytics.topProductsByRestaurant(params)`.
- **Filtros soportados**: `startDate`, `endDate`, `restaurante_id`, `limit`.

#### Etapas
1. `$match` por entregadas y filtros.
2. `$unwind` de `items`.
3. `$group` por `restaurante_id + menu_item_id`:
   - `nombre_producto` con `$first` de snapshot.
   - `unidades_vendidas` con `$sum` de `cantidad`.
   - `ingresos_generados` con `$sum` de `subtotal`.
4. `$lookup` a `restaurantes`.
5. `$project` final.
6. `$sort` descendente por volumen/ingresos.
7. `$limit` configurable.

#### Ejemplo de salida
```json
[
  {
    "restaurante_id": "...",
    "restaurante_nombre": "Burger House GT",
    "menu_item_id": "...",
    "nombre_producto": "Classic Burger",
    "unidades_vendidas": 523,
    "ingresos_generados": 33995
  }
]
```

---

### Pipeline 3: Calificación y satisfacción por restaurante
- **Objetivo de negocio**: medir calidad percibida por restaurante.
- **Colección fuente**: `resenas`.
- **Función**: `backendOperations.analytics.restaurantRatings(params)`.
- **Filtros soportados**: `startDate`, `endDate`, `restaurante_id`.

#### Etapas
1. `$match` por `visible = true` y filtros.
2. `$group` por `restaurante_id`:
   - `rating_promedio`
   - `total_resenas`
   - promedio de `aspectos.sabor`, `aspectos.tiempo_entrega`, `aspectos.presentacion`.
3. `$lookup` con `restaurantes`.
4. `$project` final.
5. `$sort` por rating y cantidad de reseñas.

#### Ejemplo de salida
```json
[
  {
    "restaurante_id": "...",
    "restaurante_nombre": "Sushi Zen",
    "rating_promedio": 4.72,
    "total_resenas": 110,
    "promedio_sabor": 4.8,
    "promedio_tiempo_entrega": 4.6,
    "promedio_presentacion": 4.7
  }
]
```

---

### Pipeline 4: Conversión de órdenes por estado (funnel)
- **Objetivo de negocio**: observar distribución y porcentaje de órdenes por estado.
- **Colección fuente**: `ordenes`.
- **Función**: `backendOperations.analytics.orderFunnel(params)`.
- **Filtros soportados**: `startDate`, `endDate`, `restaurante_id`.

#### Etapas
1. `$match` por filtros.
2. `$group` por `estado_orden` con conteo.
3. Segundo `$group` para total general y arreglo de estados.
4. `$unwind` para volver a filas por estado.
5. `$project` con cálculo de porcentaje sobre total.
6. `$addFields` para orden lógico de estados.
7. `$sort` y limpieza de salida.

#### Ejemplo de salida
```json
[
  { "estado_orden": "creada", "total": 500, "total_ordenes": 1000, "porcentaje": 50 },
  { "estado_orden": "entregada", "total": 420, "total_ordenes": 1000, "porcentaje": 42 }
]
```

---

### Pipeline 5: Tiempo promedio entre estados
- **Objetivo de negocio**: medir SLA operativo de la orden.
- **Colección fuente**: `ordenes`.
- **Función**: `backendOperations.analytics.orderStateTimes(params)`.
- **Filtros soportados**: `startDate`, `endDate`, `restaurante_id`.

#### Etapas
1. `$match` por filtros y `estado_orden = "entregada"`.
2. `$project` para extraer fechas por estado desde `historial_estados[]` usando `$filter` + `$map`.
3. `$project` con `dateDiff` para calcular minutos entre:
   - creada -> confirmada
   - confirmada -> en_preparacion
   - en_preparacion -> en_camino
   - en_camino -> entregada
4. `$group` por `restaurante_id` para promedios.
5. `$lookup` de nombre de restaurante.
6. `$project` final y `$sort`.

#### Ejemplo de salida
```json
[
  {
    "restaurante_id": "...",
    "restaurante_nombre": "Pizza Central",
    "ordenes_analizadas": 320,
    "prom_creada_confirmada": 2.4,
    "prom_confirmada_preparacion": 7.2,
    "prom_preparacion_camino": 21.6,
    "prom_camino_entregada": 18.1
  }
]
```

---

## SECCIÓN C: Mapeo entre diseño y código

- **Transacción de creación de orden**: `backend/operations.mongodb.js` función `createOrderTransactional`.
- **Transacción de publicación de reseña**: `backend/operations.mongodb.js` función `publishReviewTransactional`.
- **Pipelines analíticos**: `backend/operations.mongodb.js` funciones:
  - `salesByRestaurantMonth`
  - `topProductsByRestaurant`
  - `restaurantRatings`
  - `orderFunnel`
  - `orderStateTimes`
- **Modelo híbrido (referencias + embedding + snapshots)**: implementado en la data base de `backend/setup_db.mongodb.js` y consumido por los casos de uso en `backend/operations.mongodb.js`.

---

## Índices recomendados para rendimiento

Aplicar según carga y cardinalidad real:

```javascript
use("restaurantes_db");
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.menu_items.createIndex({ restaurante_id: 1, disponible: 1 });
db.ordenes.createIndex({ estado_orden: 1, fecha_creacion: 1 });
db.ordenes.createIndex({ restaurante_id: 1, fecha_creacion: 1 });
db.ordenes.createIndex({ usuario_id: 1, fecha_creacion: -1 });
db.resenas.createIndex({ restaurante_id: 1, visible: 1, fecha_creacion: 1 });
db.restaurantes.createIndex({ "ubicacion.geo": "2dsphere" });
```

---

## Nota de adaptación a la estructura real

El requerimiento menciona endpoints REST; en este repositorio no existe backend HTTP (controladores/rutas). Por ello, la implementación se expone como **casos de uso invocables** en mongosh, manteniendo coherencia con la arquitectura real y evitando introducir un framework nuevo no existente en el proyecto.
