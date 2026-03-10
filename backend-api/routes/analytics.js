const { Router }   = require("express");
const { getDb }    = require("../lib/mongodb");
const { ObjectId } = require("mongodb");

const router = Router();

// ---------------------------------------------------------------
// Helpers (portados de operations.mongodb.js)
// ---------------------------------------------------------------
function parseParams(query) {
  const params = {};
  if (query.restaurante_id) {
    try { params.restaurante_id = new ObjectId(query.restaurante_id); } catch (_) {}
  }
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate)   params.endDate   = query.endDate;
  if (query.limit)     params.limit     = parseInt(query.limit) || 20;
  return params;
}

function buildBaseOrderMatch(params) {
  const match = {};
  if (params.restaurante_id) match.restaurante_id = params.restaurante_id; // idx_ordenes_rest_estado_fecha
  if (params.startDate || params.endDate) {
    match.fecha_creacion = {};
    if (params.startDate) match.fecha_creacion.$gte = new Date(params.startDate); // idx_ordenes_fecha_creacion
    if (params.endDate)   match.fecha_creacion.$lte = new Date(params.endDate);
  }
  return match;
}

// ---------------------------------------------------------------
// GET /api/analytics/ventas-por-mes
// Pipeline: salesByRestaurantMonth
// ---------------------------------------------------------------
router.get("/ventas-por-mes", async (req, res) => {
  try {
    const db     = await getDb();
    const params = parseParams(req.query);
    const match  = buildBaseOrderMatch(params);
    match.estado_orden = "entregada";

    const pipeline = [
      { $match: match },
      { $addFields: { anio_mes: { $dateToString: { format: "%Y-%m", date: "$fecha_creacion" } } } },
      {
        $group: {
          _id:            { restaurante_id: "$restaurante_id", anio_mes: "$anio_mes" },
          total_ventas:   { $sum: "$resumen_pago.total" },
          total_ordenes:  { $sum: 1 },
          ticket_promedio: { $avg: "$resumen_pago.total" },
        },
      },
      {
        $lookup: { from: "restaurantes", localField: "_id.restaurante_id", foreignField: "_id", as: "restaurante" },
      },
      {
        $project: {
          _id: 0,
          restaurante_id:    "$_id.restaurante_id",
          anio_mes:          "$_id.anio_mes",
          restaurante_nombre: { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
          total_ventas:      { $round: ["$total_ventas", 2] },
          total_ordenes:     1,
          ticket_promedio:   { $round: ["$ticket_promedio", 2] },
        },
      },
      { $sort: { anio_mes: 1, total_ventas: -1 } },
    ];

    const data = await db.collection("ordenes").aggregate(pipeline).toArray();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/analytics/top-productos
// Pipeline: topProductsByRestaurant
// ---------------------------------------------------------------
router.get("/top-productos", async (req, res) => {
  try {
    const db     = await getDb();
    const params = parseParams(req.query);
    const match  = buildBaseOrderMatch(params);
    match.estado_orden = "entregada";
    const limit = params.limit || 20;

    const pipeline = [
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id:               { restaurante_id: "$restaurante_id", menu_item_id: "$items.menu_item_id" },
          nombre_producto:   { $first: "$items.nombre_snapshot" },
          unidades_vendidas: { $sum: "$items.cantidad" },
          ingresos_generados: { $sum: "$items.subtotal" },
        },
      },
      {
        $lookup: { from: "restaurantes", localField: "_id.restaurante_id", foreignField: "_id", as: "restaurante" },
      },
      {
        $project: {
          _id: 0,
          restaurante_id:     "$_id.restaurante_id",
          restaurante_nombre: { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
          menu_item_id:       "$_id.menu_item_id",
          nombre_producto:    1,
          unidades_vendidas:  1,
          ingresos_generados: { $round: ["$ingresos_generados", 2] },
        },
      },
      { $sort: { unidades_vendidas: -1, ingresos_generados: -1 } },
      { $limit: limit },
    ];

    const data = await db.collection("ordenes").aggregate(pipeline).toArray();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/analytics/ratings
// Pipeline: restaurantRatings
// ---------------------------------------------------------------
router.get("/ratings", async (req, res) => {
  try {
    const db     = await getDb();
    const params = parseParams(req.query);

    const match = { visible: true };
    if (params.restaurante_id) match.restaurante_id = params.restaurante_id;
    if (params.startDate || params.endDate) {
      match.fecha_creacion = {};
      if (params.startDate) match.fecha_creacion.$gte = new Date(params.startDate);
      if (params.endDate)   match.fecha_creacion.$lte = new Date(params.endDate);
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id:                    "$restaurante_id",
          rating_promedio:        { $avg: "$calificacion" },
          total_resenas:          { $sum: 1 },
          promedio_sabor:         { $avg: "$aspectos.sabor" },
          promedio_tiempo_entrega: { $avg: "$aspectos.tiempo_entrega" },
          promedio_presentacion:  { $avg: "$aspectos.presentacion" },
        },
      },
      {
        $lookup: { from: "restaurantes", localField: "_id", foreignField: "_id", as: "restaurante" },
      },
      {
        $project: {
          _id: 0,
          restaurante_id:          "$_id",
          restaurante_nombre:      { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
          rating_promedio:         { $round: ["$rating_promedio", 2] },
          total_resenas:           1,
          promedio_sabor:          { $round: ["$promedio_sabor", 2] },
          promedio_tiempo_entrega: { $round: ["$promedio_tiempo_entrega", 2] },
          promedio_presentacion:   { $round: ["$promedio_presentacion", 2] },
        },
      },
      { $sort: { rating_promedio: -1, total_resenas: -1 } },
    ];

    const data = await db.collection("resenas").aggregate(pipeline).toArray();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/analytics/funnel-ordenes
// Pipeline: orderFunnel
// ---------------------------------------------------------------
router.get("/funnel-ordenes", async (req, res) => {
  try {
    const db     = await getDb();
    const params = parseParams(req.query);
    const match  = buildBaseOrderMatch(params);

    const ORDER_SORT = { creada: 1, confirmada: 2, en_preparacion: 3, en_camino: 4, entregada: 5, cancelada: 6 };

    const pipeline = [
      { $match: match },
      { $group: { _id: "$estado_orden", total: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          total_ordenes: { $sum: "$total" },
          estados:       { $push: { estado_orden: "$_id", total: "$total" } },
        },
      },
      { $unwind: "$estados" },
      {
        $project: {
          _id: 0,
          estado_orden:  "$estados.estado_orden",
          total:         "$estados.total",
          total_ordenes: 1,
          porcentaje:    { $round: [{ $multiply: [{ $divide: ["$estados.total", "$total_ordenes"] }, 100] }, 2] },
        },
      },
      {
        $addFields: {
          orden_estado: {
            $switch: {
              branches: Object.entries(ORDER_SORT).map(([k, v]) => ({ case: { $eq: ["$estado_orden", k] }, then: v })),
              default: 99,
            },
          },
        },
      },
      { $sort: { orden_estado: 1 } },
      { $project: { orden_estado: 0 } },
    ];

    const data = await db.collection("ordenes").aggregate(pipeline).toArray();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/analytics/tiempos-estado
// Pipeline: orderStateTimes
// ---------------------------------------------------------------
router.get("/tiempos-estado", async (req, res) => {
  try {
    const db     = await getDb();
    const params = parseParams(req.query);
    const match  = buildBaseOrderMatch(params);
    match.estado_orden = "entregada";

    const stateDateExpr = (stateName) => ({
      $arrayElemAt: [
        {
          $map: {
            input: { $filter: { input: "$historial_estados", as: "h", cond: { $eq: ["$$h.estado", stateName] } } },
            as: "item",
            in: "$$item.fecha",
          },
        },
        0,
      ],
    });

    const pipeline = [
      { $match: match },
      {
        $project: {
          restaurante_id:    1,
          creada_at:         stateDateExpr("creada"),
          confirmada_at:     stateDateExpr("confirmada"),
          en_preparacion_at: stateDateExpr("en_preparacion"),
          en_camino_at:      stateDateExpr("en_camino"),
          entregada_at:      stateDateExpr("entregada"),
        },
      },
      {
        $project: {
          restaurante_id: 1,
          min_creada_confirmada: {
            $cond: [{ $and: ["$creada_at", "$confirmada_at"] },
              { $dateDiff: { startDate: "$creada_at", endDate: "$confirmada_at", unit: "minute" } }, null],
          },
          min_confirmada_preparacion: {
            $cond: [{ $and: ["$confirmada_at", "$en_preparacion_at"] },
              { $dateDiff: { startDate: "$confirmada_at", endDate: "$en_preparacion_at", unit: "minute" } }, null],
          },
          min_preparacion_camino: {
            $cond: [{ $and: ["$en_preparacion_at", "$en_camino_at"] },
              { $dateDiff: { startDate: "$en_preparacion_at", endDate: "$en_camino_at", unit: "minute" } }, null],
          },
          min_camino_entregada: {
            $cond: [{ $and: ["$en_camino_at", "$entregada_at"] },
              { $dateDiff: { startDate: "$en_camino_at", endDate: "$entregada_at", unit: "minute" } }, null],
          },
        },
      },
      {
        $group: {
          _id:                          "$restaurante_id",
          ordenes_analizadas:           { $sum: 1 },
          prom_creada_confirmada:       { $avg: "$min_creada_confirmada" },
          prom_confirmada_preparacion:  { $avg: "$min_confirmada_preparacion" },
          prom_preparacion_camino:      { $avg: "$min_preparacion_camino" },
          prom_camino_entregada:        { $avg: "$min_camino_entregada" },
        },
      },
      {
        $lookup: { from: "restaurantes", localField: "_id", foreignField: "_id", as: "restaurante" },
      },
      {
        $project: {
          _id: 0,
          restaurante_id:              "$_id",
          restaurante_nombre:          { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
          ordenes_analizadas:          1,
          prom_creada_confirmada:      { $round: [{ $ifNull: ["$prom_creada_confirmada", 0] }, 2] },
          prom_confirmada_preparacion: { $round: [{ $ifNull: ["$prom_confirmada_preparacion", 0] }, 2] },
          prom_preparacion_camino:     { $round: [{ $ifNull: ["$prom_preparacion_camino", 0] }, 2] },
          prom_camino_entregada:       { $round: [{ $ifNull: ["$prom_camino_entregada", 0] }, 2] },
        },
      },
      { $sort: { prom_camino_entregada: 1 } },
    ];

    const data = await db.collection("ordenes").aggregate(pipeline).toArray();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
