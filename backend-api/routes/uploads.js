const { Router } = require("express");
const multer  = require("multer");
const { ObjectId, GridFSBucket } = require("mongodb");
const { getClient } = require("../lib/mongodb");

const router = Router();

// Multer: memoria RAM → luego lo volcamos a GridFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpeg|jpg|png|gif|webp|pdf|txt|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error("Tipo de archivo no permitido"), ok);
  },
});

async function getBucket() {
  const client = await getClient();
  const db = client.db("restaurantes_db");
  return new GridFSBucket(db, { bucketName: "uploads" });
}

// ---------------------------------------------------------------
// POST /api/uploads — sube archivo a GridFS
// ---------------------------------------------------------------
router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Se requiere un archivo en el campo 'file'" });

  try {
    const bucket = await getBucket();
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        mimetype:    req.file.mimetype,
        descripcion: req.body.descripcion || "",
        tipo:        req.body.tipo        || "",
        ref_id:      req.body.ref_id      || "",
      },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", () => {
      res.status(201).json({
        data: {
          fileId:    uploadStream.id.toString(),
          filename:  req.file.originalname,
          size:      req.file.size,
          mimetype:  req.file.mimetype,
          url:       `/api/uploads/${uploadStream.id}`,
        },
      });
    });

    uploadStream.on("error", (err) => res.status(500).json({ error: err.message }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/uploads — lista archivos en GridFS
// ---------------------------------------------------------------
router.get("/", async (_req, res) => {
  try {
    const bucket = await getBucket();
    const files = await bucket.find({}).sort({ uploadDate: -1 }).limit(200).toArray();
    const data = files.map((f) => ({
      fileId:      f._id.toString(),
      filename:    f.filename,
      size:        f.length,
      mimetype:    f.metadata?.mimetype    || "",
      tipo:        f.metadata?.tipo        || "",
      descripcion: f.metadata?.descripcion || "",
      url:         `/api/uploads/${f._id}`,
      fecha_subida: f.uploadDate,
    }));
    res.json({ data, meta: { total: data.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// GET /api/uploads/:id — sirve el archivo desde GridFS (streaming)
// ---------------------------------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const bucket = await getBucket();
    const _id = new ObjectId(req.params.id);

    const files = await bucket.find({ _id }).toArray();
    if (!files.length) return res.status(404).json({ error: "Archivo no encontrado" });

    const file = files[0];
    res.set("Content-Type", file.metadata?.mimetype || "application/octet-stream");
    res.set("Content-Disposition", `inline; filename="${file.filename}"`);
    res.set("Cache-Control", "public, max-age=31536000");

    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.pipe(res);
    downloadStream.on("error", () => res.status(404).json({ error: "Archivo no encontrado" }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/uploads/:id — elimina de GridFS
// ---------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const bucket = await getBucket();
    const _id = new ObjectId(req.params.id);
    await bucket.delete(_id);
    res.json({ data: { deleted: req.params.id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
