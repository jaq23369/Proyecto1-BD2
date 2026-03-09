// =============================================================
// PROYECTO 1 - BD2 | Validación de índices con explain()
// Script para mongosh
// =============================================================

use("restaurantes_db");

const PRINT_FULL_EXPLAIN = false;

function collectFromPlan(node, stageList, indexNames) {
  if (!node || typeof node !== "object") return;

  if (node.stage && stageList.indexOf(node.stage) === -1) {
    stageList.push(node.stage);
  }

  if (node.indexName && indexNames.indexOf(node.indexName) === -1) {
    indexNames.push(node.indexName);
  }

  if (Array.isArray(node.inputStages)) {
    node.inputStages.forEach(function (child) {
      collectFromPlan(child, stageList, indexNames);
    });
  }

  if (node.inputStage) {
    collectFromPlan(node.inputStage, stageList, indexNames);
  }

  if (node.outerStage) {
    collectFromPlan(node.outerStage, stageList, indexNames);
  }

  if (node.innerStage) {
    collectFromPlan(node.innerStage, stageList, indexNames);
  }

  if (node.thenStage) {
    collectFromPlan(node.thenStage, stageList, indexNames);
  }

  if (node.elseStage) {
    collectFromPlan(node.elseStage, stageList, indexNames);
  }

  if (Array.isArray(node.shards)) {
    node.shards.forEach(function (shardDoc) {
      if (shardDoc.winningPlan) {
        collectFromPlan(shardDoc.winningPlan, stageList, indexNames);
      }
      if (shardDoc.executionStages) {
        collectFromPlan(shardDoc.executionStages, stageList, indexNames);
      }
    });
  }

  Object.keys(node).forEach(function (key) {
    const value = node[key];
    if (value && typeof value === "object") {
      if (
        key !== "inputStage" &&
        key !== "inputStages" &&
        key !== "outerStage" &&
        key !== "innerStage" &&
        key !== "thenStage" &&
        key !== "elseStage"
      ) {
        collectFromPlan(value, stageList, indexNames);
      }
    }
  });
}

function summarizeExecutionStats(explainResult) {
  const stats = explainResult.executionStats || {};
  return {
    totalDocsExamined: stats.totalDocsExamined,
    totalKeysExamined: stats.totalKeysExamined,
    executionTimeMillis: stats.executionTimeMillis,
    nReturned: stats.nReturned,
  };
}

function printExplainSummary(caseName, expectedIndex, explainResult) {
  const winningPlan = explainResult.queryPlanner && explainResult.queryPlanner.winningPlan
    ? explainResult.queryPlanner.winningPlan
    : null;

  const stages = [];
  const indexNames = [];

  collectFromPlan(winningPlan, stages, indexNames);
  collectFromPlan(explainResult.executionStats && explainResult.executionStats.executionStages, stages, indexNames);

  const usesIxscan = stages.indexOf("IXSCAN") !== -1 || stages.indexOf("GEO_NEAR_2DSPHERE") !== -1;
  const usesCollscan = stages.indexOf("COLLSCAN") !== -1;
  const stats = summarizeExecutionStats(explainResult);

  print("\n--------------------------------------------------");
  print("Caso: " + caseName);
  print("Índice esperado: " + expectedIndex);
  print("winningPlan stages: " + (stages.length ? stages.join(" -> ") : "N/A"));
  print("indexName(s): " + (indexNames.length ? indexNames.join(", ") : "N/A"));
  print("IXSCAN/GEO indexado: " + (usesIxscan ? "SI" : "NO"));
  print("COLLSCAN detectado: " + (usesCollscan ? "SI" : "NO"));
  print("totalDocsExamined: " + (stats.totalDocsExamined != null ? stats.totalDocsExamined : "N/A"));
  print("totalKeysExamined: " + (stats.totalKeysExamined != null ? stats.totalKeysExamined : "N/A"));
  print("executionTimeMillis: " + (stats.executionTimeMillis != null ? stats.executionTimeMillis : "N/A"));
  print("nReturned: " + (stats.nReturned != null ? stats.nReturned : "N/A"));

  if (PRINT_FULL_EXPLAIN) {
    print("\nExplain completo:");
    printjson(explainResult);
  }
}

function requireDoc(doc, message) {
  if (!doc) {
    throw new Error(message);
  }
  return doc;
}

print("=== Validación de índices con explain('executionStats') ===");

const sampleOrder = requireDoc(
  db.ordenes.findOne({}, { usuario_id: 1, restaurante_id: 1, _id: 0 }),
  "No hay órdenes para validar explain."
);

const sampleUserId = sampleOrder.usuario_id;
const sampleRestaurantId = sampleOrder.restaurante_id;

const sampleTagDoc = requireDoc(
  db.menu_items.findOne({ tags: { $exists: true, $ne: [] } }, { tags: 1, _id: 0 }),
  "No hay menu_items con tags para validar índice multikey."
);
const sampleTag = sampleTagDoc.tags[0];

const sampleRestaurantGeo = requireDoc(
  db.restaurantes.findOne({ "ubicacion.geo": { $exists: true } }, { "ubicacion.geo": 1, _id: 0 }),
  "No hay restaurantes con ubicación geoespacial para validar 2dsphere."
);

const sampleTextDoc = requireDoc(
  db.menu_items.findOne({}, { nombre: 1, _id: 0 }),
  "No hay menu_items para validar índice de texto."
);
const textTerm = sampleTextDoc.nombre.split(" ")[0];

const sampleReview = requireDoc(
  db.resenas.findOne({}, { restaurante_id: 1, _id: 0 }),
  "No hay reseñas para validar índice de reseñas por restaurante/fecha."
);

const dateStart = new Date("2025-01-01T00:00:00Z");
const dateEnd = new Date("2027-01-01T00:00:00Z");

// 1) Historial de órdenes por usuario
const expOrdersByUser = db.ordenes
  .find({ usuario_id: sampleUserId })
  .sort({ fecha_creacion: -1 })
  .limit(20)
  .explain("executionStats");
printExplainSummary(
  "Historial de órdenes por usuario",
  "idx_ordenes_usuario_id",
  expOrdersByUser
);

// 2) Órdenes por restaurante + estado + fecha
const expOrdersByRestStateDate = db.ordenes
  .find({
    restaurante_id: sampleRestaurantId,
    estado_orden: "entregada",
    fecha_creacion: { $gte: dateStart, $lte: dateEnd },
  })
  .sort({ fecha_creacion: -1 })
  .limit(50)
  .explain("executionStats");
printExplainSummary(
  "Órdenes por restaurante + estado + fecha",
  "idx_ordenes_rest_estado_fecha",
  expOrdersByRestStateDate
);

// 3) Búsqueda por tags (multikey)
const expMenuByTags = db.menu_items
  .find({ tags: sampleTag })
  .limit(30)
  .explain("executionStats");
printExplainSummary(
  "Búsqueda por tags en catálogo",
  "idx_menu_items_tags",
  expMenuByTags
);

// 4) Búsqueda geoespacial ($near)
const geoPoint = sampleRestaurantGeo.ubicacion.geo;
const expGeoNear = db.restaurantes
  .find({
    "ubicacion.geo": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: geoPoint.coordinates,
        },
        $maxDistance: 5000,
      },
    },
  })
  .limit(20)
  .explain("executionStats");
printExplainSummary(
  "Búsqueda geoespacial de restaurantes cercanos",
  "idx_restaurantes_ubicacion_geo_2dsphere",
  expGeoNear
);

// 5) Búsqueda textual en menú
const expTextSearch = db.menu_items
  .find(
    { $text: { $search: textTerm } },
    {
      nombre: 1,
      score: { $meta: "textScore" },
    }
  )
  .sort({ score: { $meta: "textScore" } })
  .limit(20)
  .explain("executionStats");
printExplainSummary(
  "Búsqueda textual de menu_items",
  "idx_menu_items_text_search",
  expTextSearch
);

// 6) Reseñas por restaurante + fecha
const expReviewsByRestDate = db.resenas
  .find({
    restaurante_id: sampleReview.restaurante_id,
    fecha_creacion: { $gte: dateStart, $lte: dateEnd },
  })
  .sort({ fecha_creacion: -1 })
  .limit(20)
  .explain("executionStats");
printExplainSummary(
  "Reseñas por restaurante y fecha",
  "idx_resenas_restaurante_fecha",
  expReviewsByRestDate
);

print("\nValidación completada. Si deseas ver explain completo, cambia PRINT_FULL_EXPLAIN=true.");
