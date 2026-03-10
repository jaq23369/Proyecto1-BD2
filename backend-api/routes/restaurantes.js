const { Router } = require("express");
const { getDb }  = require("../lib/mongodb");
const { ObjectId } = require("mongodb");

const router = Router();

// ---------------------------------------------------------------
// GET /api/restaurantes
// Filtros: estado, categoria_principal, q (texto), lat+lng+maxKm (geo)
// Paginacion: page, limit
// Sort: sort=rating|nombre|fecha  order=asc|desc
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const {
      estado, categoria_principal,
      q,
      lat, lng, maxKm,
      sort = "rating", order = "desc",
      page = 1, limit = 20,
    } = req.query;

    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const skip   = (pageN - 1) * limitN;

    // Busqueda geoespacial — usa idx_restaurantes_ubicacion_geo_2dsphere
    if (lat && lng) {
      const maxMeters = parseFloat(maxKm || 5) * 1000;
      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distancia_m",
            maxDistance: maxMeters,
            spherical: true,
            query: estado ? { estado } : {},
          },
        },
        {
          $project: {
            nombre: 1, categoria_principal: 1, categorias: 1,
            descripcion: 1, estado: 1, ubicacion: 1, contacto: 1,
            estadisticas: 1, distancia_m: 1,
          },
        },
        { $skip: skip },
        { $limit: limitN },
      ];
      const docs = await db.collection("restaurantes").aggregate(pipeline).toArray();
      return res.json({ data: docs, meta: { page: pageN, limit: limitN } });
    }

    // Busqueda de texto en menu_items — usa idx_menu_items_text_search
    if (q) {
      const menuItems = await db.collection("menu_items").aggregate([
        { $match: { $text: { $search: q }, disponible: true } },
        { $group: { _id: "$restaurante_id" } },
      ]).toArray();
      const restIds = menuItems.map((m) => m._id);

      const filter = { _id: { $in: restIds } };
      if (estado) filter.estado = estado;

      const docs = await db.collection("restaurantes")
        .find(filter, { projection: { nombre: 1, categoria_principal: 1, estadisticas: 1, ubicacion: 1 } })
        .sort({ "estadisticas.rating_promedio": -1 })
        .skip(skip)
        .limit(limitN)
        .toArray();

      const total = await db.collection("restaurantes").countDocuments(filter);
      return res.json({ data: docs, meta: { total, page: pageN, limit: limitN } });
    }

    // Lista general con filtros — coleccion pequena (~5,000 docs), COLLSCAN aceptable
    const filter = {};
    if (estado) filter.estado = estado;
    if (categoria_principal) filter.categoria_principal = categoria_principal;

    const sortField = sort === "nombre" ? "nombre" : sort === "fecha" ? "fecha_creacion" : "estadisticas.rating_promedio";
    const sortDir   = order === "asc" ? 1 : -1;

    const [docs, total] = await Promise.all([
      db.collection("restaurantes")
        .find(filter, {
          projection: {
            nombre: 1, slug: 1, categoria_principal: 1, categorias: 1,
            descripcion: 1, estado: 1, ubicacion: 1, contacto: 1,
            estadisticas: 1, horarios: 1,
          },
        })
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitN)
        .toArray(),
      db.collection("restaurantes").countDocuments(filter),
    ]);

    res.json({ data: docs, meta: { total, page: pageN, limit: limitN } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/restaurantes/stats/count  — agregacion simple
// ---------------------------------------------------------------
router.get("/stats/count", async (req, res) => {
  try {
    const db = await getDb();
    const activos   = await db.collection("restaurantes").countDocuments({ estado: "activo" });
    const inactivos = await db.collection("restaurantes").countDocuments({ estado: "inactivo" });
    const categorias = await db.collection("restaurantes").distinct("categoria_principal");
    res.json({ data: { activos, inactivos, total: activos + inactivos, categorias_distintas: categorias.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/restaurantes/stats/categorias  — distinct
// ---------------------------------------------------------------
router.get("/stats/categorias", async (req, res) => {
  try {
    const db = await getDb();
    const categorias = await db.collection("restaurantes").distinct("categoria_principal");
    res.json({ data: categorias });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/restaurantes/:id
// ---------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);

    const doc = await db.collection("restaurantes").findOne(
      { _id },
      { projection: { nombre: 1, slug: 1, categoria_principal: 1, categorias: 1, descripcion: 1, estado: 1, contacto: 1, ubicacion: 1, horarios: 1, estadisticas: 1, fecha_creacion: 1 } }
    );
    if (!doc) return res.status(404).json({ error: "Restaurante no encontrado" });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/restaurantes
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const db   = await getDb();
    const body = req.body;

    if (!body.nombre) return res.status(400).json({ error: "nombre es obligatorio" });

    const doc = {
      nombre:              body.nombre.trim(),
      slug:                (body.slug || body.nombre).toLowerCase().replace(/\s+/g, "-"),
      categoria_principal: body.categoria_principal || "",
      categorias:          Array.isArray(body.categorias) ? body.categorias : [],
      descripcion:         body.descripcion || "",
      estado:              body.estado || "activo",
      contacto:            body.contacto || {},
      ubicacion:           body.ubicacion || {},
      horarios:            Array.isArray(body.horarios) ? body.horarios : [],
      estadisticas:        { rating_promedio: 0, total_resenas: 0, total_ordenes: 0 },
      fecha_creacion:      new Date(),
      fecha_actualizacion: new Date(),
    };

    const result = await db.collection("restaurantes").insertOne(doc);
    res.status(201).json({ data: { insertedId: result.insertedId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// PUT /api/restaurantes/:id  — updateOne
// ---------------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const db   = await getDb();
    const _id  = new ObjectId(req.params.id);
    const body = req.body;

    const allowed = ["nombre", "descripcion", "estado", "contacto", "horarios", "categorias", "categoria_principal", "ubicacion"];
    const set = { fecha_actualizacion: new Date() };
    allowed.forEach((k) => { if (body[k] !== undefined) set[k] = body[k]; });

    const result = await db.collection("restaurantes").updateOne({ _id }, { $set: set });
    if (result.matchedCount === 0) return res.status(404).json({ error: "Restaurante no encontrado" });
    res.json({ data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/restaurantes/:id/categorias  — $addToSet
// ---------------------------------------------------------------
router.post("/:id/categorias", async (req, res) => {
  try {
    const db       = await getDb();
    const _id      = new ObjectId(req.params.id);
    const { categoria } = req.body;
    if (!categoria) return res.status(400).json({ error: "categoria es obligatorio" });

    const result = await db.collection("restaurantes").updateOne(
      { _id },
      { $addToSet: { categorias: categoria }, $set: { fecha_actualizacion: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Restaurante no encontrado" });
    res.json({ data: { modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
