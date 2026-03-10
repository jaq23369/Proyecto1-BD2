const { Router }    = require("express");
const { getDb, getClient } = require("../lib/mongodb");
const { GridFSBucket, ObjectId } = require("mongodb");
const multer = require("multer");

const router  = Router();
// multer en memoria: el buffer se pasa directamente al GridFSBucket
const upload  = multer({ storage: multer.memoryStorage() });

const BUCKET_NAME = "archivos";
const MAX_FILE_MB = 16;

// ---------------------------------------------------------------
// POST /api/uploads
// Sube un archivo via multipart/form-data (campo: file)
// Params opcionales en body: descripcion, tipo (restaurante|menu_item), ref_id
// Devuelve: fileId que se puede guardar en imagenes[] del documento
// ---------------------------------------------------------------
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Se requiere un archivo en el campo 'file'" });

    const fileSizeMb = req.file.size / (1024 * 1024);
    if (fileSizeMb > MAX_FILE_MB) {
      return res.status(400).json({ error: `El archivo excede el limite de ${MAX_FILE_MB}MB` });
    }

    const mongoClient = await getClient();
    const db          = mongoClient.db("restaurantes_db");
    const bucket      = new GridFSBucket(db, { bucketName: BUCKET_NAME });

    const metadata = {
      originalname: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      descripcion:  req.body.descripcion || "",
      tipo:         req.body.tipo        || "general",
      ref_id:       req.body.ref_id      || null,
      fecha_subida: new Date(),
    };

    // Abre un stream de escritura hacia GridFS y escribe el buffer
    const uploadStream = bucket.openUploadStream(req.file.originalname, { metadata });

    await new Promise((resolve, reject) => {
      uploadStream.end(req.file.buffer, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    res.status(201).json({
      data: {
        fileId:      uploadStream.id,
        filename:    req.file.originalname,
        size:        req.file.size,
        mimetype:    req.file.mimetype,
        url:         `/api/uploads/${uploadStream.id}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/uploads/:fileId
// Recupera y sirve el archivo desde GridFS por su ObjectId
// ---------------------------------------------------------------
router.get("/:fileId", async (req, res) => {
  try {
    const mongoClient = await getClient();
    const db          = mongoClient.db("restaurantes_db");
    const bucket      = new GridFSBucket(db, { bucketName: BUCKET_NAME });
    const fileId      = new ObjectId(req.params.fileId);

    // Verificar que el archivo existe y obtener su metadata
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ error: "Archivo no encontrado" });

    const file = files[0];
    res.set("Content-Type",   file.metadata.mimetype || "application/octet-stream");
    res.set("Content-Length", file.length);
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", () => res.status(404).json({ error: "Error al leer el archivo" }));
    downloadStream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/uploads — lista los archivos subidos a GridFS
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const mongoClient = await getClient();
    const db          = mongoClient.db("restaurantes_db");
    const bucket      = new GridFSBucket(db, { bucketName: BUCKET_NAME });

    const { tipo, page = 1, limit = 20 } = req.query;
    const pageN  = Math.max(1, parseInt(page));
    const limitN = Math.min(100, Math.max(1, parseInt(limit)));
    const skip   = (pageN - 1) * limitN;

    const filter = {};
    if (tipo) filter["metadata.tipo"] = tipo;

    const files = await bucket
      .find(filter)
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limitN)
      .toArray();

    const docs = files.map((f) => ({
      fileId:      f._id,
      filename:    f.filename,
      size:        f.length,
      mimetype:    f.metadata && f.metadata.mimetype,
      descripcion: f.metadata && f.metadata.descripcion,
      tipo:        f.metadata && f.metadata.tipo,
      ref_id:      f.metadata && f.metadata.ref_id,
      fecha_subida: f.uploadDate,
      url:         `/api/uploads/${f._id}`,
    }));

    res.json({ data: docs, meta: { page: pageN, limit: limitN } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/uploads/:fileId — elimina archivo de GridFS (fs.files + fs.chunks)
// ---------------------------------------------------------------
router.delete("/:fileId", async (req, res) => {
  try {
    const mongoClient = await getClient();
    const db          = mongoClient.db("restaurantes_db");
    const bucket      = new GridFSBucket(db, { bucketName: BUCKET_NAME });
    const fileId      = new ObjectId(req.params.fileId);

    // Verificar existencia antes de borrar
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ error: "Archivo no encontrado" });

    await bucket.delete(fileId);
    res.json({ data: { deletedId: fileId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
