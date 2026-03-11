# crud.mongodb.js — Documentación

**Proyecto 1 · BD2 · Universidad del Valle de Guatemala**  
**Autor:** Joel Jaquez — 23369  
**Script:** `backend/06_crud.mongodb.js`

---

## ¿Qué hace este script?

Demuestra todas las operaciones CRUD del proyecto sobre datos reales en `restaurantes_db`. Crea documentos nuevos al inicio, los usa a lo largo del script para lecturas, actualizaciones y operaciones de arrays, y al final elimina solo los que tienen sentido borrar. Los documentos principales quedan en la base de datos como evidencia.

---

## Cobertura de la rúbrica

| Criterio                                 | Estado | Sección   |
|------------------------------------------|--------|-----------|
| Creación de documento embebido           | ✅     | CREATE 1, 2 |
| Creación de documentos referenciados     | ✅     | CREATE 3, 4, 5 |
| Insertar uno y varios documentos         | ✅     | CREATE 1–5 |
| Lectura con lookup multi-colección       | ✅     | READ 2, 3, 4, 5 |
| Filtros, proyecciones, sort, skip, limit | ✅     | READ 1–5 |
| Actualizar 1 documento                   | ✅     | UPDATE 1, 2 |
| Actualizar varios documentos             | ✅     | UPDATE 3, 4 |
| Eliminar 1 documento                     | ✅     | DELETE 1 |
| Eliminar varios documentos               | ✅     | DELETE 2 |
| `$push`                                  | ✅     | ARRAY 1, 4 |
| `$pull`                                  | ✅     | ARRAY 2 |
| `$addToSet`                              | ✅     | ARRAY 3, 5 |
| Agregaciones simples (count, distinct)   | ✅     | SIMPLE 1–8 |
| Documentos embebidos (dot notation)      | ✅     | UPDATE 1, ARRAY 1 |

---

## SECCIÓN 1: CREATE

### CREATE 1 — `insertOne` usuario (documento embebido)
Crea un usuario con campos embebidos dentro del mismo documento:
- `direccion_principal {}` — dirección con coordenadas GeoJSON
- `direcciones []` — array con una dirección adicional (Trabajo)
- `preferencias {}` — idioma y notificaciones

**Colección:** `usuarios`  
**Por qué embedded:** las direcciones y preferencias siempre se consultan junto con el usuario, no tienen sentido fuera de él.

---

### CREATE 2 — `insertOne` restaurante (documento embebido)
Crea "Tacos El Buen Sabor CRUD" con todos sus campos embebidos:
- `contacto {}` — teléfono y email
- `ubicacion {}` — dirección y coordenadas GeoJSON
- `horarios []` — 7 entradas, una por día de la semana
- `estadisticas {}` — contadores inicializados en 0

**Colección:** `restaurantes`

---

### CREATE 3 — `insertMany` 3 menu items (documentos referenciados)
Crea tres artículos del menú vinculados al restaurante del CREATE 2:
- Taco de Carnitas CRUD (Q25.00)
- Burrito de Pollo CRUD (Q45.00)
- Quesadilla de Queso CRUD (Q35.00)

**Colección:** `menu_items`  
**Por qué referenced:** `restaurante_id` apunta al `ObjectId` del restaurante. Un restaurante puede tener miles de items; embeber todo en el restaurante inflaría el documento innecesariamente.

---

### CREATE 4 — `insertOne` orden (diseño híbrido)
Crea una orden completa con:
- **Referenced:** `usuario_id` y `restaurante_id` como ObjectIds
- **Embedded con snapshot:** `items []` guarda `nombre_snapshot` y `precio_unitario_snapshot` para preservar el valor histórico aunque el menú cambie después
- **Embedded:** `direccion_entrega {}`, `resumen_pago {}`, `historial_estados []` con 5 eventos de estado

**Colección:** `ordenes`

---

### CREATE 5 — `insertOne` reseña (totalmente referenciada)
Crea una reseña vinculada a la orden, usuario y restaurante de los pasos anteriores. Incluye calificación 5/5 y aspectos detallados (sabor, tiempo_entrega, presentacion).

**Colección:** `resenas`  
**Por qué 3 referencias:** permite validar que existe la orden, el usuario y el restaurante, y facilita aggregation pipelines por cualquier dimensión.

---

## SECCIÓN 2: READ

Todas las consultas usan proyecciones (`_id: 0`, campos específicos), filtros, sort, skip y limit.

### READ 1 — Restaurantes activos paginados
- **Filtro:** `estado: "activo"`
- **Proyección:** nombre, categoria_principal, estadisticas.rating_promedio, ubicacion.direccion_texto
- **Sort:** `"estadisticas.rating_promedio": -1` (mayor rating primero)
- **Skip:** 5 | **Limit:** 5 (página 2, 5 por página)

---

### READ 2 — Órdenes de un usuario con datos del restaurante (`$lookup`)
- **Lookup:** `ordenes` → `restaurantes` por `restaurante_id`
- **Filtro:** `usuario_id` del usuario creado en CREATE 1, estado "entregada"
- **Sort:** `fecha_creacion: -1`
- **Limit:** 10

---

### READ 3 — Menu items con nombre del restaurante (`$lookup`)
- **Lookup:** `menu_items` → `restaurantes` por `restaurante_id`
- **Filtro:** `disponible: true`, precio entre Q20 y Q100
- **Sort:** `precio: 1` (más barato primero)
- **Skip:** 0 | **Limit:** 10

---

### READ 4 — Reseñas enriquecidas con usuario y restaurante (doble `$lookup`)
- **Lookups:** `resenas` → `usuarios` y `resenas` → `restaurantes`
- **Filtro:** `calificacion >= 4`, `visible: true`
- **Sort:** `fecha_creacion: -1`
- **Limit:** 5

---

### READ 5 — Restaurantes cercanos (índice geoespacial `$near`)
- **Operador:** `$near` con `$geometry` Point y `$maxDistance` 3000 metros
- **Punto de referencia:** Zona 10, Guatemala (-90.51, 14.60)
- **Proyección:** nombre, ubicacion, estadisticas.rating_promedio

---

## SECCIÓN 3: UPDATE

### UPDATE 1 — `updateOne` usuario
Actualiza un solo documento usando dot notation para campo embebido:
```javascript
$set: {
  telefono: "+50299990002",
  "preferencias.notificaciones": false,  // dot notation en campo embebido
  fecha_actualizacion: new Date()
}
```

### UPDATE 2 — `updateOne` menu item
Actualiza precio y disponibilidad de un artículo específico por `_id`.

### UPDATE 3 — `updateMany` menu items sin ventas
Marca como `disponible: false` todos los items del restaurante nuevo que tengan `metricas.veces_pedido < 5`.

### UPDATE 4 — `updateMany` con pipeline de actualización
Sube el precio 5% a todos los items de categoría "Tacos" usando pipeline stage `$set` con expresión aritmética:
```javascript
$set: {
  precio: { $round: [{ $multiply: ["$precio", 1.05] }, 2] }
}
```

---

## SECCIÓN 4: MANEJO DE ARRAYS

### ARRAY 1 — `$push` nueva dirección al usuario
Agrega un tercer elemento al array `direcciones []` del usuario con alias "Gym" y coordenadas GeoJSON.

### ARRAY 2 — `$pull` quitar tag
Elimina el valor `"picante"` del array `tags []` de todos los items del restaurante nuevo que lo tengan.

### ARRAY 3 — `$addToSet` agregar tag sin duplicados
Agrega `"nuevo"` al array `tags []` de todos los items del restaurante. Si ya existiera, no se duplica.

### ARRAY 4 — `$push` nuevo estado al historial de la orden
Agrega un nuevo evento `"reseña_recibida"` al array `historial_estados []` de la orden creada.

### ARRAY 5 — `$addToSet` nueva categoría al restaurante
Agrega `"Fusion"` al array `categorias []` del restaurante sin duplicar.

---

## SECCIÓN 5: AGREGACIONES SIMPLES

| # | Operación     | Colección    | Descripción                                      |
|---|---------------|--------------|--------------------------------------------------|
| 1 | `countDocuments` | usuarios  | Total de usuarios con `estado: "activo"`         |
| 2 | `countDocuments` | ordenes   | Total de órdenes con `estado_orden: "entregada"` |
| 3 | `countDocuments` | menu_items| Total de items con `disponible: true`            |
| 4 | `distinct`       | restaurantes| Valores únicos de `categoria_principal`        |
| 5 | `distinct`       | ordenes   | Métodos de pago distintos usados                 |
| 6 | `distinct`       | ordenes   | Estados de orden existentes en la colección      |
| 7 | `countDocuments` | ordenes   | Órdenes creadas en el año 2026 (filtro por fecha)|
| 8 | `countDocuments` | resenas   | Reseñas con `calificacion: 5`                    |

---

## SECCIÓN 6: DELETE

### DELETE 1 — `deleteOne` menu item
Busca la "Quesadilla de Queso CRUD" por nombre y restaurante, y la elimina por su `_id`. Incluye validación por si ya fue eliminada antes.

### DELETE 2 — `deleteMany` usuarios inactivos sin órdenes
Proceso de dos pasos:
1. `distinct("usuario_id")` en órdenes para obtener quiénes sí tienen pedidos
2. `deleteMany` con condiciones:
   - `estado: "inactivo"`
   - `fecha_creacion >= 2026-01-01` (solo los recientes)
   - `_id: { $nin: usuariosConOrdenes }` (que no tengan órdenes)

---

## Documentos que quedan en la DB

Al terminar el script, permanecen en Atlas como evidencia:

| Colección     | Descripción                        |
|---------------|------------------------------------|
| `usuarios`    | Ana Martinez CRUD                  |
| `restaurantes`| Tacos El Buen Sabor CRUD           |
| `menu_items`  | Taco de Carnitas + Burrito de Pollo|
| `ordenes`     | ORD-CRUD-000001                    |
| `resenas`     | Reseña 5 estrellas de Ana          |

---

## Cómo ejecutar

```bash
# En mongosh conectado a Atlas:
load("backend/06_crud.mongodb.js")

# O desde terminal:
mongosh "mongodb+srv://..." --file backend/06_crud.mongodb.js
```

> El script imprime el resultado de cada operación en consola (`matchedCount`, `modifiedCount`, `deletedCount`, etc.) para verificar que cada paso funcionó correctamente.
