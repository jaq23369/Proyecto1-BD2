# setup_db.mongodb.js — Documentación

**Proyecto 1 · BD2 · Universidad del Valle de Guatemala**  
**Autor:** Joel Jaquez — 23369  
**Script:** `backend/setup_db.mongodb.js`

---

## ¿Qué hace este script?

Inicializa desde cero la base de datos `restaurantes_db` en MongoDB Atlas. Elimina cualquier colección existente, crea las 5 colecciones del proyecto e inserta datos base realistas más bloques masivos de datos generados con Bulk para cumplir el requisito de más de 50,000 documentos.

---

## Colecciones creadas

| Colección     | Docs base | Bulk generado | Total aprox. |
|---------------|-----------|---------------|--------------|
| `usuarios`    | 5         | ~20,000       | ~20,005      |
| `restaurantes`| 3         | ~5,000        | ~5,003       |
| `menu_items`  | 9         | 50,000        | ~50,009      |
| `ordenes`     | 4         | 50,000        | ~50,004      |
| `resenas`     | 2         | ~30,000       | ~30,002      |

---

## Estructura de cada colección

### `usuarios`
Contiene clientes y administradores de la plataforma.

**Campos embebidos (embedding justificado):**
- `direccion_principal {}` — se consulta siempre junto con el usuario
- `direcciones []` — array de direcciones adicionales del usuario
- `preferencias {}` — idioma y configuración de notificaciones

**Campos clave:** `tipo_usuario`, `nombre`, `email`, `telefono`, `estado`, `fecha_creacion`

```json
{
  "tipo_usuario": "cliente",
  "nombre": "Nery Molina",
  "email": "nery@bd2proyecto.com",
  "estado": "activo",
  "direccion_principal": {
    "alias": "Casa",
    "direccion_texto": "Zona 7, Guatemala",
    "geo": { "type": "Point", "coordinates": [-90.55, 14.62] }
  },
  "preferencias": { "idioma": "es", "notificaciones": true }
}
```

---

### `restaurantes`
Comercios disponibles en la plataforma.

**Campos embebidos (embedding justificado):**
- `contacto {}` — teléfono y email, siempre se leen con el restaurante
- `ubicacion {}` — incluye coordenadas GeoJSON para índice geoespacial
- `horarios []` — 7 entradas (una por día), cardinalidad fija y baja
- `estadisticas {}` — rating, total de reseñas y órdenes para listados rápidos

**Campos clave:** `nombre`, `slug`, `categoria_principal`, `categorias []`, `estado`

---

### `menu_items`
Catálogo de productos. Usa **referencing** hacia `restaurantes`.

**Referenciado:**
- `restaurante_id` → `ObjectId` de la colección `restaurantes`
  - Justificación: un restaurante puede tener miles de items; embeber inflaría el documento del restaurante

**Campos embebidos:**
- `imagenes []` — URLs de Unsplash, principal: true/false
- `opciones []` — variantes del producto (tamaño, extras)
- `metricas {}` — contador `veces_pedido` para análisis

**Campos clave:** `nombre`, `categoria`, `precio`, `disponible`, `tags []`

---

### `ordenes`
Colección transaccional principal del sistema. Diseño híbrido.

**Referenciado:**
- `usuario_id` → `ObjectId` de `usuarios`
- `restaurante_id` → `ObjectId` de `restaurantes`

**Embebido (justificación: snapshot histórico e integridad):**
- `items []` — cada item guarda `nombre_snapshot` y `precio_unitario_snapshot` para preservar el valor al momento de la compra aunque el menú cambie después
- `direccion_entrega {}` — foto de la dirección al momento del pedido
- `resumen_pago {}` — subtotal, envío, descuento, total, método y estado de pago
- `historial_estados []` — trazabilidad completa: creada → confirmada → en_preparacion → en_camino → entregada/cancelada

**Estados posibles:** `creada`, `confirmada`, `en_preparacion`, `en_camino`, `entregada`, `cancelada`

---

### `resenas`
Opiniones post-entrega. Totalmente referenciada.

**Referenciado (3 referencias):**
- `orden_id` → garantiza que solo se reseñan órdenes reales
- `usuario_id` → para análisis por cliente
- `restaurante_id` → para análisis por restaurante

**Embebido:**
- `aspectos {}` — notas de sabor, tiempo_entrega y presentacion (1-5)

**Campos clave:** `calificacion` (1-5), `comentario`, `visible`

> Las calificaciones del bulk tienen sesgo positivo (45% son 5 estrellas) para simular comportamiento real de apps de delivery.

---

## Datos base (no generados)

### Usuarios base (5)
| Nombre         | Tipo    | Estado   |
|----------------|---------|----------|
| Nery Molina    | cliente | activo   |
| Joel Jaquez    | cliente | activo   |
| Luis Gonzalez  | admin   | activo   |
| Maria Garcia   | cliente | activo   |
| Carlos Perez   | cliente | inactivo |

### Restaurantes base (3)
| Nombre          | Categoría      | Rating |
|-----------------|----------------|--------|
| Pizza Central   | Pizza          | 4.6    |
| Burger House GT | Hamburguesas   | 4.3    |
| Sushi Zen       | Japonesa/Sushi | 4.8    |

---

## Generación Bulk

El script usa `initializeUnorderedBulkOp()` para insertar los documentos en lotes eficientes. Se usan funciones helper:

- `randomInt(min, max)` — entero aleatorio en rango
- `randomFloat(min, max)` — decimal con 2 decimales
- `randomDate(start, end)` — fecha aleatoria en rango
- `randomFrom(array)` — elemento aleatorio de un array
- `randomGeoGuatemala()` — coordenadas GeoJSON dentro de Guatemala Ciudad

Los `menu_items` usan URLs reales de Unsplash para imágenes de platillos.  
Las `ordenes` generan automáticamente el `historial_estados` coherente con el `estado_orden` final.

---

## Al final del script

Automáticamente intenta cargar `backend/03_indexes.mongodb.js` para crear los índices necesarios. Si no lo encuentra, imprime instrucciones para ejecutarlo manualmente.

---

## Cómo ejecutar

```bash
# En mongosh conectado a Atlas:
load("backend/setup_db.mongodb.js")

# O desde terminal:
mongosh "mongodb+srv://..." --file backend/setup_db.mongodb.js
```

> ⚠️ El script hace `drop()` de todas las colecciones al inicio. No ejecutar en producción sin respaldo.
