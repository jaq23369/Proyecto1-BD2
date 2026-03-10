const { Router }   = require("express");
const { getDb, getClient } = require("../lib/mongodb");
const { ObjectId } = require("mongodb");

const router = Router();

const DB_NAME = "restaurantes_db";

const ORDER_STATES = {
  CREADA:         "creada",
  CONFIRMADA:     "confirmada",
  EN_PREPARACION: "en_preparacion",
  EN_CAMINO:      "en_camino",
  ENTREGADA:      "entregada",
  CANCELADA:      "cancelada",
};

const VALID_STATES = Object.values(ORDER_STATES);

// ---------------------------------------------------------------
// Helpers (portados de operations.mongodb.js)
// ---------------------------------------------------------------
function rounded2(v) { return parseFloat(Number(v).toFixed(2)); }

// ---------------------------------------------------------------
// GET /api/ordenes
// Filtros: usuario_id, restaurante_id, estado_orden, startDate, endDate
// Sort: sort=fecha|total  order=asc|desc | Paginacion: page, limit
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const {
      usuario_id, restaurante_id, estado_orden,
      startDate, endDate,
      sort = "fecha", order = "desc",
      page = 1, limit = 20,
    } = req.query;

    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const skip   = (pageN - 1) * limitN;

    const filter = {};
    if (usuario_id)     filter.usuario_id     = new ObjectId(usuario_id);    // idx_ordenes_usuario_id
    if (restaurante_id) filter.restaurante_id = new ObjectId(restaurante_id); // idx_ordenes_rest_estado_fecha
    if (estado_orden)   filter.estado_orden   = estado_orden;
    if (startDate || endDate) {
      filter.fecha_creacion = {};
      if (startDate) filter.fecha_creacion.$gte = new Date(startDate); // idx_ordenes_fecha_creacion
      if (endDate)   filter.fecha_creacion.$lte = new Date(endDate);
    }

    const sortField = sort === "total" ? "resumen_pago.total" : "fecha_creacion";
    const sortDir   = order === "asc" ? 1 : -1;

    const [docs, total] = await Promise.all([
      db.collection("ordenes")
        .find(filter, {
          projection: {
            codigo_orden: 1, estado_orden: 1, usuario_id: 1, restaurante_id: 1,
            "resumen_pago.total": 1, "resumen_pago.metodo_pago": 1, "resumen_pago.estado_pago": 1,
            fecha_creacion: 1, fecha_actualizacion: 1,
          },
        })
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitN)
        .toArray(),
      db.collection("ordenes").countDocuments(filter),
    ]);

    res.json({ data: docs, meta: { total, page: pageN, limit: limitN } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/ordenes/stats/count — agregaciones simples
// ---------------------------------------------------------------
router.get("/stats/count", async (req, res) => {
  try {
    const db = await getDb();
    const estados      = await db.collection("ordenes").distinct("estado_orden");
    const metodosPago  = await db.collection("ordenes").distinct("resumen_pago.metodo_pago");
    const entregadas   = await db.collection("ordenes").countDocuments({ estado_orden: "entregada" });
    const canceladas   = await db.collection("ordenes").countDocuments({ estado_orden: "cancelada" });
    const total        = await db.collection("ordenes").estimatedDocumentCount();
    res.json({ data: { total, entregadas, canceladas, estados_distintos: estados, metodos_pago: metodosPago } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/ordenes/:id — con lookup a usuarios y restaurantes
// ---------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);

    const docs = await db.collection("ordenes").aggregate([
      { $match: { _id } },
      {
        $lookup: {
          from: "usuarios", localField: "usuario_id", foreignField: "_id",
          as: "usuario",
        },
      },
      {
        $lookup: {
          from: "restaurantes", localField: "restaurante_id", foreignField: "_id",
          as: "restaurante",
        },
      },
      { $unwind: { path: "$usuario",     preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$restaurante", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          codigo_orden: 1, estado_orden: 1, notas_cliente: 1,
          direccion_entrega: 1, items: 1, resumen_pago: 1, historial_estados: 1,
          fecha_creacion: 1, fecha_actualizacion: 1,
          "usuario._id": 1, "usuario.nombre": 1, "usuario.email": 1,
          "restaurante._id": 1, "restaurante.nombre": 1, "restaurante.categoria_principal": 1,
        },
      },
    ]).toArray();

    if (!docs.length) return res.status(404).json({ error: "Orden no encontrada" });
    res.json({ data: docs[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/ordenes — TX ACID (portado de operations.mongodb.js createOrderTransactional)
// Valida items, embebe snapshot, actualiza estadisticas via bulkWrite
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  const mongoClient = await getClient();
  const session     = mongoClient.startSession();

  try {
    const body = req.body;

    if (!body.usuario_id)     return res.status(400).json({ error: "usuario_id es obligatorio" });
    if (!body.restaurante_id) return res.status(400).json({ error: "restaurante_id es obligatorio" });
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: "items debe ser un array con al menos un elemento" });
    }

    const usuarioId    = new ObjectId(body.usuario_id);
    const restauranteId = new ObjectId(body.restaurante_id);
    const costoEnvio   = rounded2(body.costo_envio  || 0);
    const descuento    = rounded2(body.descuento     || 0);
    const impuestos    = rounded2(body.impuestos     || 0);
    const metodoPago   = body.metodo_pago  || "efectivo";
    const estadoPago   = body.estado_pago  || "pendiente";

    let transactionResult;

    await session.withTransaction(async () => {
      const db = mongoClient.db(DB_NAME);

      const restaurante = await db.collection("restaurantes").findOne(
        { _id: restauranteId, estado: "activo" },
        { session }
      );
      if (!restaurante) throw new Error("Restaurante no encontrado o inactivo");

      const requestedIds = body.items.map((item, i) => {
        if (!item.menu_item_id) throw new Error(`items[${i}].menu_item_id es obligatorio`);
        return new ObjectId(item.menu_item_id);
      });

      const menuDocs = await db.collection("menu_items")
        .find({ _id: { $in: requestedIds }, restaurante_id: restauranteId }, { session })
        .toArray();

      if (menuDocs.length !== requestedIds.length) {
        throw new Error("Uno o mas menu_items no existen o no pertenecen al restaurante");
      }

      const menuById = {};
      menuDocs.forEach((d) => { menuById[d._id.toString()] = d; });

      const snapItems  = [];
      const itemCounter = {};
      let subtotal = 0;

      for (const item of body.items) {
        const menuDoc = menuById[new ObjectId(item.menu_item_id).toString()];
        if (!menuDoc.disponible) throw new Error(`${menuDoc.nombre} no esta disponible`);

        const cantidad      = parseInt(item.cantidad);
        if (!cantidad || cantidad < 1) throw new Error("cantidad debe ser >= 1");

        const precioUnit    = rounded2(menuDoc.precio);
        const subtotalItem  = rounded2(precioUnit * cantidad);
        subtotal += subtotalItem;

        const id = new ObjectId(item.menu_item_id).toString();
        itemCounter[id] = (itemCounter[id] || 0) + cantidad;

        snapItems.push({
          menu_item_id:             new ObjectId(item.menu_item_id),
          nombre_snapshot:          menuDoc.nombre,
          precio_unitario_snapshot: precioUnit,
          cantidad,
          subtotal:                 subtotalItem,
          opciones_seleccionadas:   Array.isArray(item.opciones_seleccionadas) ? item.opciones_seleccionadas : [],
        });
      }

      subtotal       = rounded2(subtotal);
      const total    = rounded2(subtotal + costoEnvio + impuestos - descuento);
      const fechaEvento = new Date();

      const ordenDoc = {
        codigo_orden:     body.codigo_orden || null,
        usuario_id:       usuarioId,
        restaurante_id:   restauranteId,
        estado_orden:     ORDER_STATES.CREADA,
        notas_cliente:    body.notas_cliente || "",
        direccion_entrega: body.direccion_entrega || null,
        items:            snapItems,
        resumen_pago: {
          subtotal, costo_envio: costoEnvio, descuento, impuestos, total,
          metodo_pago: metodoPago, estado_pago: estadoPago,
        },
        historial_estados: [{ estado: ORDER_STATES.CREADA, fecha: fechaEvento, usuario_evento: "sistema" }],
        fecha_creacion:      fechaEvento,
        fecha_actualizacion: fechaEvento,
      };

      const insertResult = await db.collection("ordenes").insertOne(ordenDoc, { session });

      await db.collection("restaurantes").updateOne(
        { _id: restauranteId },
        { $inc: { "estadisticas.total_ordenes": 1 }, $set: { fecha_actualizacion: fechaEvento } },
        { session }
      );

      // bulkWrite para actualizar metricas.veces_pedido de cada menu_item
      const bulkOps = Object.entries(itemCounter).map(([id, cant]) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $inc: { "metricas.veces_pedido": cant }, $set: { fecha_actualizacion: fechaEvento } },
        },
      }));
      if (bulkOps.length > 0) {
        await db.collection("menu_items").bulkWrite(bulkOps, { ordered: false, session });
      }

      transactionResult = { orden_id: insertResult.insertedId, subtotal, total, items: snapItems.length };
    });

    res.status(201).json({ data: transactionResult });
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

// ---------------------------------------------------------------
// PATCH /api/ordenes/:id — updateOne: cambio de estado + $push historial
// ---------------------------------------------------------------
router.patch("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);
    const { estado_orden, usuario_evento = "sistema" } = req.body;

    if (!estado_orden || !VALID_STATES.includes(estado_orden)) {
      return res.status(400).json({ error: `estado_orden debe ser uno de: ${VALID_STATES.join(", ")}` });
    }

    const fechaEvento = new Date();
    const result = await db.collection("ordenes").updateOne(
      { _id },
      {
        $set:  { estado_orden, fecha_actualizacion: fechaEvento },
        $push: { historial_estados: { estado: estado_orden, fecha: fechaEvento, usuario_evento } },
      }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Orden no encontrada" });
    res.json({ data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
