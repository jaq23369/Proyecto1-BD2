// =============================================================
// PROYECTO 1 - BD2 | Índices operativos y analíticos
// Script idempotente para mongosh
// =============================================================

use("restaurantes_db");

const NORMALIZE_EQUIVALENT_NAMES = true;

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function keyPatternEquals(a, b) {
  if (!isObject(a) || !isObject(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (keysB[i] !== key) return false;
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function weightsEquals(a, b) {
  if (!isObject(a) || !isObject(b)) return false;
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (keysB[i] !== key) return false;
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function findEquivalentIndex(existingIndexes, key, options) {
  const isTextIndex = Object.keys(key).some(function (field) {
    return key[field] === "text";
  });

  if (isTextIndex) {
    return existingIndexes.find(function (idx) {
      return idx.key && idx.key._fts === "text" && weightsEquals(idx.weights, options.weights || {});
    });
  }

  return existingIndexes.find(function (idx) {
    if (!keyPatternEquals(idx.key, key)) return false;
    if (options.unique === true && idx.unique !== true) return false;
    return true;
  });
}

function ensureIndex(collectionName, key, options, notes) {
  const col = db.getCollection(collectionName);
  const expectedName = options.name;
  const existingIndexes = col.getIndexes();
  const existing = existingIndexes.find(function (idx) {
    return idx.name === expectedName;
  });

  if (existing) {
    print("[OK] Ya existe " + collectionName + "." + expectedName);
    if (notes) print("     ↳ " + notes);
    return { action: "exists", name: expectedName };
  }

  try {
    const createdName = col.createIndex(key, options);
    print("[CREATED] " + collectionName + "." + createdName);
    if (notes) print("          ↳ " + notes);
    return { action: "created", name: createdName };
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    print("[WARN] No se pudo crear " + collectionName + "." + expectedName);
    print("       Motivo: " + message);

    if (message.indexOf("already exists with a different name") !== -1) {
      const equivalent = findEquivalentIndex(existingIndexes, key, options);

      if (equivalent && NORMALIZE_EQUIVALENT_NAMES) {
        print("       Se encontró índice equivalente: " + equivalent.name);
        print("       Normalizando nombre a: " + expectedName);
        col.dropIndex(equivalent.name);
        const recreated = col.createIndex(key, options);
        print("[RENAMED] " + collectionName + "." + equivalent.name + " -> " + recreated);
        return { action: "renamed", name: recreated };
      }

      print("       Ya existe un índice equivalente con otro nombre.");
      return { action: "equivalent_exists", name: expectedName };
    }

    throw error;
  }
}

print("\n=== Creación de índices ===");

// 1) Índice simple: historial de órdenes por usuario
ensureIndex(
  "ordenes",
  { usuario_id: 1 },
  { name: "idx_ordenes_usuario_id" },
  "Historial de órdenes por usuario (perfil cliente)."
);

// 2) Índice compuesto: panel operativo y reportes por restaurante + estado + fecha
ensureIndex(
  "ordenes",
  { restaurante_id: 1, estado_orden: 1, fecha_creacion: -1 },
  { name: "idx_ordenes_rest_estado_fecha" },
  "Soporta filtros operativos y pipelines por restaurante/estado/fecha."
);

// 3) Índice multikey: filtro por tags del catálogo
ensureIndex(
  "menu_items",
  { tags: 1 },
  { name: "idx_menu_items_tags" },
  "Búsqueda por etiquetas de productos (array -> multikey)."
);

// 4) Índice geoespacial: cercanía de restaurantes
ensureIndex(
  "restaurantes",
  { "ubicacion.geo": "2dsphere" },
  { name: "idx_restaurantes_ubicacion_geo_2dsphere" },
  "Consultas $near / $geoWithin de restaurantes cercanos."
);

// 5) Índice de texto: búsqueda textual en catálogo
ensureIndex(
  "menu_items",
  {
    nombre: "text",
    descripcion: "text",
    tags: "text",
  },
  {
    name: "idx_menu_items_text_search",
    weights: {
      nombre: 10,
      tags: 6,
      descripcion: 4,
    },
  },
  "Búsqueda por nombre/descripcion/tags con ponderación."
);

// 5B) Índice de texto: búsqueda textual en restaurantes por nombre
ensureIndex(
  "restaurantes",
  {
    nombre: "text",
    descripcion: "text",
    categoria_principal: "text",
  },
  {
    name: "idx_restaurantes_text_search",
    weights: {
      nombre: 10,
      categoria_principal: 5,
      descripcion: 2,
    },
  },
  "Búsqueda por nombre/descripcion/categoria de restaurantes."
);

// 6A) Índice adicional: reseñas por restaurante y fecha
ensureIndex(
  "resenas",
  { restaurante_id: 1, fecha_creacion: -1 },
  { name: "idx_resenas_restaurante_fecha" },
  "Listados recientes y pipeline de rating por restaurante."
);

// 6B) Índice adicional: reportes globales por fecha de orden
ensureIndex(
  "ordenes",
  { fecha_creacion: -1 },
  { name: "idx_ordenes_fecha_creacion" },
  "Reportes cronológicos globales de órdenes."
);

// 6C) Índice adicional: catálogo por restaurante/disponibilidad/categoría
ensureIndex(
  "menu_items",
  { restaurante_id: 1, disponible: 1, categoria: 1 },
  { name: "idx_menu_items_rest_disponible_categoria" },
  "Soporta navegación de catálogo y filtros de disponibilidad/categoría."
);

// 6D) Índice único adicional: una reseña por orden
ensureIndex(
  "resenas",
  { orden_id: 1 },
  { name: "uq_resenas_orden_id", unique: true },
  "Refuerza regla de negocio: 1 reseña por orden."
);

// ---------------------------------------------------------------
// Shard key indexes — evidencia de diseno de sharding
//
// menu_items  -> cubierto por idx_menu_items_rest_disponible_categoria
//               (restaurante_id es prefijo)
// resenas     -> cubierto por idx_resenas_restaurante_fecha
//               (restaurante_id es prefijo)
// ordenes     -> idx_ordenes_rest_estado_fecha NO cubre la shard key
//               { restaurante_id, fecha_creacion } porque estado_orden
//               interrumpe el prefijo; se crea el indice especifico.
// ---------------------------------------------------------------

// SK-1) Shard key de ordenes: { restaurante_id: 1, fecha_creacion: 1 }
ensureIndex(
  "ordenes",
  { restaurante_id: 1, fecha_creacion: 1 },
  { name: "idx_sk_ordenes_restaurante_fecha" },
  "Shard key compuesto de ordenes: evita hotspots monotonos y soporta query targeting por restaurante + rango de fecha."
);

print("\n=== Resumen de índices por colección ===");
["usuarios", "restaurantes", "menu_items", "ordenes", "resenas"].forEach(function (name) {
  const indexes = db.getCollection(name).getIndexes().map(function (idx) {
    return idx.name;
  });
  print("- " + name + ": " + indexes.join(", "));
});

print("\nScript de índices finalizado.");
