const path     = require("path");
const fs       = require("fs");
const { Router }   = require("express");
const { getDb }    = require("../lib/mongodb");
const { ObjectId } = require("mongodb");
const multer   = require("multer");
const { v4: uuidv4 } = require("uuid");

const router = Router();

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const imgUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpeg|jpg|png|gif|webp)$/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error("Solo se permiten imágenes"), ok);
  },
});

// ---------------------------------------------------------------
// GET /api/menu-items
// Filtros: restaurante_id, disponible, categoria, tags (array -> multikey)
// Paginacion: page, limit | Sort: sort=precio|nombre  order=asc|desc
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const {
      restaurante_id, disponible, categoria, tags,
      sort = "nombre", order = "asc",
      page = 1, limit = 20,
    } = req.query;

    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const skip   = (pageN - 1) * limitN;

    const filter = {};
    if (restaurante_id) filter.restaurante_id = new ObjectId(restaurante_id);
    if (disponible !== undefined) filter.disponible = disponible === "true";
    if (categoria)   filter.categoria = categoria;
    if (tags)        filter.tags = Array.isArray(tags) ? { $in: tags } : tags; // multikey

    const sortField = sort === "precio" ? "precio" : "nombre";
    const sortDir   = order === "desc" ? -1 : 1;

    const [docs, total] = await Promise.all([
      db.collection("menu_items")
        .find(filter, {
          projection: { nombre: 1, descripcion: 1, categoria: 1, precio: 1, moneda: 1, disponible: 1, tags: 1, imagenes: 1, opciones: 1, restaurante_id: 1 },
        })
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limitN)
        .toArray(),
      db.collection("menu_items").countDocuments(filter),
    ]);

    res.json({ data: docs, meta: { total, page: pageN, limit: limitN } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/menu-items/stats/count — agregacion simple
// ---------------------------------------------------------------
router.get("/stats/count", async (req, res) => {
  try {
    const db = await getDb();
    const disponibles   = await db.collection("menu_items").countDocuments({ disponible: true });
    const noDisponibles = await db.collection("menu_items").countDocuments({ disponible: false });
    const categorias    = await db.collection("menu_items").distinct("categoria");
    res.json({ data: { disponibles, no_disponibles: noDisponibles, total: disponibles + noDisponibles, categorias_distintas: categorias.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// PATCH /api/menu-items/bulk-disable — updateMany: deshabilitar items sin ventas
// ---------------------------------------------------------------
router.patch("/bulk-disable", async (req, res) => {
  try {
    const db = await getDb();
    const { restaurante_id, umbral = 5 } = req.body;

    const filter = {
      "metricas.veces_pedido": { $lt: parseInt(umbral) },
      disponible: true,
    };
    if (restaurante_id) filter.restaurante_id = new ObjectId(restaurante_id);

    const result = await db.collection("menu_items").updateMany(
      filter,
      { $set: { disponible: false, fecha_actualizacion: new Date() } }
    );
    res.json({ data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// PATCH /api/menu-items/bulk-price — updateMany: ajuste % por categoria
// ---------------------------------------------------------------
router.patch("/bulk-price", async (req, res) => {
  try {
    const db = await getDb();
    const { categoria, porcentaje } = req.body;

    if (!categoria || porcentaje === undefined) {
      return res.status(400).json({ error: "categoria y porcentaje son obligatorios" });
    }

    const factor = 1 + parseFloat(porcentaje) / 100;

    const result = await db.collection("menu_items").updateMany(
      { categoria, disponible: true },
      [
        {
          $set: {
            precio:              { $round: [{ $multiply: ["$precio", factor] }, 2] },
            fecha_actualizacion: new Date(),
          },
        },
      ]
    );
    res.json({ data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/menu-items/:id
// ---------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);
    const doc = await db.collection("menu_items").findOne({ _id });
    if (!doc) return res.status(404).json({ error: "Menu item no encontrado" });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/menu-items — insertOne o insertMany
// Body puede ser objeto (uno) o array (varios)
// ---------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const db   = await getDb();
    const body = req.body;

    const toDoc = (item) => {
      if (!item.restaurante_id) throw new Error("restaurante_id es obligatorio");
      if (!item.nombre)         throw new Error("nombre es obligatorio");
      if (!item.precio)         throw new Error("precio es obligatorio");
      return {
        restaurante_id:      new ObjectId(item.restaurante_id),
        nombre:              item.nombre.trim(),
        descripcion:         item.descripcion || "",
        categoria:           item.categoria || "",
        precio:              parseFloat(item.precio),
        moneda:              item.moneda || "GTQ",
        disponible:          item.disponible !== false,
        tags:                Array.isArray(item.tags) ? item.tags : [],
        imagenes:            Array.isArray(item.imagenes) ? item.imagenes : [],
        opciones:            Array.isArray(item.opciones) ? item.opciones : [],
        metricas:            { veces_pedido: 0 },
        fecha_creacion:      new Date(),
        fecha_actualizacion: new Date(),
      };
    };

    if (Array.isArray(body)) {
      const docs   = body.map(toDoc);
      const result = await db.collection("menu_items").insertMany(docs);
      return res.status(201).json({ data: { insertedCount: result.insertedCount, insertedIds: result.insertedIds } });
    }

    const result = await db.collection("menu_items").insertOne(toDoc(body));
    res.status(201).json({ data: { insertedId: result.insertedId } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// PUT /api/menu-items/:id — updateOne
// ---------------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const db   = await getDb();
    const _id  = new ObjectId(req.params.id);
    const body = req.body;

    const allowed = ["nombre", "descripcion", "categoria", "precio", "disponible", "imagenes", "opciones"];
    const set = { fecha_actualizacion: new Date() };
    allowed.forEach((k) => { if (body[k] !== undefined) set[k] = body[k]; });

    const result = await db.collection("menu_items").updateOne({ _id }, { $set: set });
    if (result.matchedCount === 0) return res.status(404).json({ error: "Menu item no encontrado" });
    res.json({ data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/menu-items/:id — deleteOne
// ---------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);

    const result = await db.collection("menu_items").deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Menu item no encontrado" });
    res.json({ data: { deletedCount: result.deletedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/menu-items/:id/tags — $addToSet (no duplica)
// ---------------------------------------------------------------
router.post("/:id/tags", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);
    const { tag } = req.body;
    if (!tag) return res.status(400).json({ error: "tag es obligatorio" });

    const result = await db.collection("menu_items").updateOne(
      { _id },
      { $addToSet: { tags: tag }, $set: { fecha_actualizacion: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Menu item no encontrado" });
    res.json({ data: { modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/menu-items/:id/tags/:tag — $pull del array
// ---------------------------------------------------------------
router.delete("/:id/tags/:tag", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);
    const tag = req.params.tag;

    const result = await db.collection("menu_items").updateOne(
      { _id },
      { $pull: { tags: tag }, $set: { fecha_actualizacion: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Menu item no encontrado" });
    res.json({ data: { modifiedCount: result.modifiedCount } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/menu-items/:id/imagen
// Sube una imagen al disco y hace $push a menu_items.imagenes
// Body: multipart/form-data, campo "file". Opcional: "principal" (bool)
// ---------------------------------------------------------------
router.post("/:id/imagen", imgUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Se requiere un archivo de imagen en el campo 'file'" });
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);

    const doc = await db.collection("menu_items").findOne({ _id });
    if (!doc) {
      fs.unlinkSync(req.file.path); // limpiar archivo si el item no existe
      return res.status(404).json({ error: "Menu item no encontrado" });
    }

    const isPrincipal = req.body.principal === "true";
    const imgEntry = { url: `/uploads/${req.file.filename}`, principal: isPrincipal };

    const update = { $push: { imagenes: imgEntry }, $set: { fecha_actualizacion: new Date() } };
    // Si es principal, desmarcar las demás
    if (isPrincipal) {
      await db.collection("menu_items").updateOne(
        { _id },
        { $set: { "imagenes.$[].principal": false } }
      );
    }
    await db.collection("menu_items").updateOne({ _id }, update);

    const updated = await db.collection("menu_items").findOne({ _id }, { projection: { imagenes: 1 } });
    res.status(201).json({ data: updated.imagenes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/menu-items/:id/imagen
// Body JSON: { url: "/uploads/uuid.jpg" } o URL externa
// Elimina del array y del disco si es local
// ---------------------------------------------------------------
router.delete("/:id/imagen", async (req, res) => {
  try {
    const db  = await getDb();
    const _id = new ObjectId(req.params.id);
    const { url: urlToRemove } = req.body;

    if (!urlToRemove) return res.status(400).json({ error: "url es obligatorio en el body" });

    const result = await db.collection("menu_items").updateOne(
      { _id },
      { $pull: { imagenes: { url: urlToRemove } }, $set: { fecha_actualizacion: new Date() } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Menu item no encontrado" });

    // Solo eliminar del disco si es una imagen local (/uploads/...)
    if (urlToRemove.startsWith("/uploads/")) {
      const filename = path.basename(urlToRemove);
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const updated = await db.collection("menu_items").findOne({ _id }, { projection: { imagenes: 1 } });
    res.json({ data: updated.imagenes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
