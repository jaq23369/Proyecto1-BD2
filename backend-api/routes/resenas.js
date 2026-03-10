const { Router }   = require("express");
const { getDb, getClient } = require("../lib/mongodb");
const { ObjectId } = require("mongodb");

const router = Router();

const DB_NAME = "restaurantes_db";

function rounded2(v) { return parseFloat(Number(v).toFixed(2)); }

// ---------------------------------------------------------------
// GET /api/resenas
// Filtros: restaurante_id, usuario_id, visible, calificacion_min
// Sort: calificacion | Paginacion: page, limit
// Lookup a usuarios
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const {
      restaurante_id, usuario_id, visible, calificacion_min,
      page = 1, limit = 20,
    } = req.query;

    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const skip   = (pageN - 1) * limitN;

    const matchFilter = {};
    if (restaurante_id) matchFilter.restaurante_id = new ObjectId(restaurante_id); // idx_resenas_restaurante_fecha
    if (usuario_id)     matchFilter.usuario_id     = new ObjectId(usuario_id);
    if (visible !== undefined) matchFilter.visible = visible === "true";
    if (calificacion_min) matchFilter.calificacion = { $gte: parseInt(calificacion_min) };

    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: "usuarios", localField: "usuario_id", foreignField: "_id",
          as: "usuario",
        },
      },
      { $unwind: { path: "$usuario", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          calificacion: 1, comentario: 1, aspectos: 1, visible: 1, fecha_creacion: 1,
          restaurante_id: 1, orden_id: 1,
          "usuario._id": 1, "usuario.nombre": 1,
        },
      },
      { $sort: { calificacion: -1, fecha_creacion: -1 } },
      { $skip: skip },
      { $limit: limitN },
    ];

    const [docs, total] = await Promise.all([
      db.collection("resenas").aggregate(pipeline).toArray(),
      db.collection("resenas").countDocuments(matchFilter),
    ]);

    res.json({ data: docs, meta: { total, page: pageN, limit: limitN } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/resenas/:id
// ---------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);
    const doc = await db.collection("resenas").findOne({ _id });
    if (!doc) return res.status(404).json({ error: "Resena no encontrada" });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/resenas — TX ACID (portado de operations.mongodb.js publishReviewTransactional)
// Verifica orden entregada, crea resena, recalcula rating del restaurante
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  const mongoClient = await getClient();
  const session     = mongoClient.startSession();

  try {
    const body = req.body;

    if (!body.orden_id)    return res.status(400).json({ error: "orden_id es obligatorio" });
    if (!body.usuario_id)  return res.status(400).json({ error: "usuario_id es obligatorio" });
    if (!body.calificacion) return res.status(400).json({ error: "calificacion es obligatorio" });

    const ordenId    = new ObjectId(body.orden_id);
    const usuarioId  = new ObjectId(body.usuario_id);
    const calificacion = parseInt(body.calificacion);

    if (calificacion < 1 || calificacion > 5) {
      return res.status(400).json({ error: "calificacion debe estar entre 1 y 5" });
    }

    let transactionResult;

    await session.withTransaction(async () => {
      const db = mongoClient.db(DB_NAME);

      const orden = await db.collection("ordenes").findOne({ _id: ordenId }, { session });
      if (!orden) throw new Error("La orden indicada no existe");

      if (orden.usuario_id.toString() !== usuarioId.toString()) {
        throw new Error("La orden no pertenece al usuario indicado");
      }

      if (orden.estado_orden !== "entregada") {
        throw new Error("Solo se permite resenar ordenes entregadas");
      }

      const existingReview = await db.collection("resenas").findOne({ orden_id: ordenId }, { session });
      if (existingReview) throw new Error("La orden ya tiene una resena registrada");

      const fechaResena = new Date();

      const resenaDoc = {
        orden_id:       ordenId,
        usuario_id:     usuarioId,
        restaurante_id: orden.restaurante_id,
        calificacion,
        comentario:     body.comentario || "",
        aspectos: {
          sabor:          parseInt((body.aspectos || {}).sabor          || calificacion),
          tiempo_entrega: parseInt((body.aspectos || {}).tiempo_entrega || calificacion),
          presentacion:   parseInt((body.aspectos || {}).presentacion   || calificacion),
        },
        visible:        body.visible !== false,
        fecha_creacion: fechaResena,
      };

      const insertResult = await db.collection("resenas").insertOne(resenaDoc, { session });

      // Recalcular promedio de rating del restaurante
      const ratingAgg = await db.collection("resenas").aggregate([
        { $match: { restaurante_id: orden.restaurante_id, visible: true } },
        { $group: { _id: "$restaurante_id", rating_promedio: { $avg: "$calificacion" }, total_resenas: { $sum: 1 } } },
      ], { session }).toArray();

      const ratingDoc = ratingAgg[0] || { rating_promedio: calificacion, total_resenas: 1 };

      await db.collection("restaurantes").updateOne(
        { _id: orden.restaurante_id },
        {
          $set: {
            "estadisticas.rating_promedio": rounded2(ratingDoc.rating_promedio),
            "estadisticas.total_resenas":   ratingDoc.total_resenas,
            fecha_actualizacion:            fechaResena,
          },
        },
        { session }
      );

      transactionResult = {
        resena_id:      insertResult.insertedId,
        restaurante_id: orden.restaurante_id,
        rating_promedio: rounded2(ratingDoc.rating_promedio),
        total_resenas:   ratingDoc.total_resenas,
      };
    });

    res.status(201).json({ data: transactionResult });
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

// ---------------------------------------------------------------
// DELETE /api/resenas/:id — deleteOne
// ---------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);

    const result = await db.collection("resenas").deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Resena no encontrada" });
    res.json({ data: { deletedCount: result.deletedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
