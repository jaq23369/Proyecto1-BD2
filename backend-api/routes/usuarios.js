const { Router }   = require("express");
const { getDb }    = require("../lib/mongodb");
const { ObjectId } = require("mongodb");

const router = Router();

// ---------------------------------------------------------------
// GET /api/usuarios
// Filtros: estado, tipo_usuario | Paginacion: page, limit
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const { estado, tipo_usuario, page = 1, limit = 20 } = req.query;

    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const skip   = (pageN - 1) * limitN;

    const filter = {};
    if (estado)       filter.estado       = estado;
    if (tipo_usuario) filter.tipo_usuario = tipo_usuario;

    const [docs, total] = await Promise.all([
      db.collection("usuarios")
        .find(filter, { projection: { nombre: 1, email: 1, telefono: 1, tipo_usuario: 1, estado: 1, fecha_creacion: 1 } })
        .sort({ fecha_creacion: -1 })
        .skip(skip)
        .limit(limitN)
        .toArray(),
      db.collection("usuarios").countDocuments(filter),
    ]);

    res.json({ data: docs, meta: { total, page: pageN, limit: limitN } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/usuarios/stats/count — agregacion simple
// ---------------------------------------------------------------
router.get("/stats/count", async (req, res) => {
  try {
    const db = await getDb();
    const activos   = await db.collection("usuarios").countDocuments({ estado: "activo" });
    const inactivos = await db.collection("usuarios").countDocuments({ estado: "inactivo" });
    res.json({ data: { activos, inactivos, total: activos + inactivos } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/usuarios/:id
// ---------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);

    const doc = await db.collection("usuarios").findOne({ _id });
    if (!doc) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/usuarios — insertOne con documento embebido
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const db   = await getDb();
    const body = req.body;

    if (!body.nombre || !body.email) {
      return res.status(400).json({ error: "nombre y email son obligatorios" });
    }

    const exists = await db.collection("usuarios").findOne({ email: body.email });
    if (exists) return res.status(400).json({ error: "El email ya esta registrado" });

    const doc = {
      tipo_usuario:        body.tipo_usuario || "cliente",
      nombre:              body.nombre.trim(),
      email:               body.email.trim().toLowerCase(),
      telefono:            body.telefono || "",
      estado:              "activo",
      direccion_principal: body.direccion_principal || {},
      direcciones:         Array.isArray(body.direcciones) ? body.direcciones : [],
      preferencias:        body.preferencias || { idioma: "es", notificaciones: true },
      fecha_creacion:      new Date(),
      fecha_actualizacion: new Date(),
    };

    const result = await db.collection("usuarios").insertOne(doc);
    res.status(201).json({ data: { insertedId: result.insertedId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// PUT /api/usuarios/:id — updateOne (campos y documento embebido)
// ---------------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const db   = await getDb();
    const _id  = new ObjectId(req.params.id);
    const body = req.body;

    const allowed = ["nombre", "telefono", "estado", "preferencias", "direccion_principal"];
    const set = { fecha_actualizacion: new Date() };
    allowed.forEach((k) => { if (body[k] !== undefined) set[k] = body[k]; });

    const result = await db.collection("usuarios").updateOne({ _id }, { $set: set });
    if (result.matchedCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/usuarios/inactive — deleteMany: usuarios inactivos sin ordenes
// ---------------------------------------------------------------
router.delete("/inactive", async (req, res) => {
  try {
    const db = await getDb();

    const usuariosConOrdenes = await db.collection("ordenes").distinct("usuario_id");

    const result = await db.collection("usuarios").deleteMany({
      estado: "inactivo",
      _id:    { $nin: usuariosConOrdenes },
    });

    res.json({ data: { deletedCount: result.deletedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/usuarios/:id — deleteOne
// ---------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);

    const result = await db.collection("usuarios").deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ data: { deletedCount: result.deletedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/usuarios/:id/direcciones — $push al array direcciones
// ---------------------------------------------------------------
router.post("/:id/direcciones", async (req, res) => {
  try {
    const db   = await getDb();
    const _id  = new ObjectId(req.params.id);
    const body = req.body;

    if (!body.alias || !body.direccion_texto) {
      return res.status(400).json({ error: "alias y direccion_texto son obligatorios" });
    }

    const nuevaDireccion = {
      alias:           body.alias,
      direccion_texto: body.direccion_texto,
      geo:             body.geo || null,
    };

    const result = await db.collection("usuarios").updateOne(
      { _id },
      { $push: { direcciones: nuevaDireccion }, $set: { fecha_actualizacion: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ data: { modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/usuarios/:id/direcciones/:alias — $pull del array
// ---------------------------------------------------------------
router.delete("/:id/direcciones/:alias", async (req, res) => {
  try {
    const db    = await getDb();
    const _id   = new ObjectId(req.params.id);
    const alias = req.params.alias;

    const result = await db.collection("usuarios").updateOne(
      { _id },
      { $pull: { direcciones: { alias } }, $set: { fecha_actualizacion: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ data: { modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
