# Índices MongoDB del proyecto (mongosh)

## Scripts del repo

- [backend/03_indexes.mongodb.js](../backend/03_indexes.mongodb.js): crea índices reales (idempotente).
- [backend/04_indexes_explain.mongodb.js](../backend/04_indexes_explain.mongodb.js): valida uso con `explain("executionStats")`.
- [backend/05_query_guardrails.mongodb.js](../backend/05_query_guardrails.mongodb.js): revisión de soporte para rechazo de consultas no indexadas y alternativa realista.

## Cómo ejecutar

Desde la raíz del repo en `mongosh`:

1. `load("backend/setup_db.mongodb.js")` (opcional, también carga índices al final).
2. `load("backend/03_indexes.mongodb.js")`.
3. `load("backend/04_indexes_explain.mongodb.js")`.
4. `load("backend/05_query_guardrails.mongodb.js")`.

---

## Índices implementados

### 1) `idx_ordenes_usuario_id`

- **Colección**: `ordenes`
- **Tipo**: simple
- **Campos**: `{ usuario_id: 1 }`
- **Consulta objetivo**:
  - historial de órdenes por usuario con orden por recencia.
- **Beneficia**:
  - consultas de perfil cliente.
  - `createOrderTransactional` (lecturas de historial posteriores).

### 2) `idx_ordenes_rest_estado_fecha`

- **Colección**: `ordenes`
- **Tipo**: compuesto
- **Campos**: `{ restaurante_id: 1, estado_orden: 1, fecha_creacion: -1 }`
- **Consulta objetivo**:
  - panel operativo por restaurante + estado + fecha.
- **Beneficia**:
  - `salesByRestaurantMonth`.
  - `orderFunnel`.
  - `orderStateTimes`.

### 3) `idx_menu_items_tags`

- **Colección**: `menu_items`
- **Tipo**: multikey (automático por array)
- **Campos**: `{ tags: 1 }`
- **Consulta objetivo**:
  - filtros por etiqueta (`pizza`, `vegano`, `picante`, etc.).
- **Beneficia**:
  - búsquedas de catálogo.

### 4) `idx_restaurantes_ubicacion_geo_2dsphere`

- **Colección**: `restaurantes`
- **Tipo**: geoespacial `2dsphere`
- **Campos**: `{ "ubicacion.geo": "2dsphere" }`
- **Consulta objetivo**:
  - búsqueda de restaurantes cercanos (`$near`, `$geoWithin`).
- **Beneficia**:
  - casos de discovery por proximidad.

### 5) `idx_menu_items_text_search`

- **Colección**: `menu_items`
- **Tipo**: texto
- **Campos**:
  - `nombre`, `descripcion`, `tags`
- **Pesos**:
  - `nombre: 10`, `tags: 6`, `descripcion: 4`
- **Consulta objetivo**:
  - búsqueda textual del catálogo.
- **Beneficia**:
  - UX de búsqueda libre en menú.

### 6A) `idx_resenas_restaurante_fecha`

- **Colección**: `resenas`
- **Tipo**: compuesto
- **Campos**: `{ restaurante_id: 1, fecha_creacion: -1 }`
- **Consulta objetivo**:
  - reseñas recientes por restaurante.
- **Beneficia**:
  - `restaurantRatings`.
  - listados recientes de reseñas.

### 6B) `idx_ordenes_fecha_creacion`

- **Colección**: `ordenes`
- **Tipo**: simple
- **Campos**: `{ fecha_creacion: -1 }`
- **Consulta objetivo**:
  - reportes globales cronológicos.
- **Beneficia**:
  - reportes por fecha fuera de filtro por restaurante.

### 6C) `idx_menu_items_rest_disponible_categoria`

- **Colección**: `menu_items`
- **Tipo**: compuesto
- **Campos**: `{ restaurante_id: 1, disponible: 1, categoria: 1 }`
- **Consulta objetivo**:
  - catálogo por restaurante con filtros de disponibilidad/categoría.
- **Beneficia**:
  - lecturas de catálogo y validaciones operativas.

### 6D) `uq_resenas_orden_id`

- **Colección**: `resenas`
- **Tipo**: único
- **Campos**: `{ orden_id: 1 }`
- **Consulta/Regla objetivo**:
  - una reseña por orden.
- **Beneficia**:
  - refuerzo de integridad en `publishReviewTransactional`.

---

## Validación con `explain("executionStats")`

El script [backend/04_indexes_explain.mongodb.js](../backend/04_indexes_explain.mongodb.js) deja pruebas para:

1. Historial de órdenes por usuario.
2. Órdenes por restaurante + estado + fecha.
3. Búsqueda por tags.
4. Búsqueda geoespacial (`$near`).
5. Búsqueda textual (`$text`).
6. Reseñas por restaurante y fecha.

Para cada caso imprime:

- caso probado
- índice esperado
- `winningPlan` (stages)
- uso de `IXSCAN`/`GEO_NEAR_2DSPHERE` vs `COLLSCAN`
- `totalDocsExamined`
- `totalKeysExamined`
- `executionTimeMillis`

> Si quieres inspección completa, en el script cambia `PRINT_FULL_EXPLAIN = true`.

---

## Rechazo de consultas no indexadas (limitación real)

No existe una opción universal y segura para “rechazar toda consulta no indexada” en cualquier despliegue MongoDB tradicional.

Se agregó el script [backend/05_query_guardrails.mongodb.js](../backend/05_query_guardrails.mongodb.js) que:

- detecta si el entorno expone comandos de Query Settings por query shape.
- documenta limitación cuando no están disponibles.
- deja checklist operativo realista:
  - medir con `explain("executionStats")`
  - revisar `winningPlan`
  - validar `IXSCAN`/`GEO_NEAR_2DSPHERE`
  - evitar `COLLSCAN` en consultas críticas del backend.

---

## Nota de diseño (no sobreindexar)

Se evitó agregar índices redundantes fuera del alcance del proyecto.

La combinación de índices simple + compuestos responde directamente a:

- transacciones: `createOrderTransactional`, `publishReviewTransactional`.
- pipelines: `salesByRestaurantMonth`, `topProductsByRestaurant`, `restaurantRatings`, `orderFunnel`, `orderStateTimes`.
