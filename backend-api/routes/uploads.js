const path    = require("path");
const fs      = require("fs");
const { Router } = require("express");
const multer  = require("multer");
const { v4: uuidv4 } = require("uuid");

const router = Router();

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename:    (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extOk = /\.(jpeg|jpg|png|gif|webp|pdf|txt|csv)$/.test(
      path.extname(file.originalname).toLowerCase()
    );
    cb(extOk ? null : new Error("Tipo de archivo no permitido"), extOk);
  },
});

// ---------------------------------------------------------------
// POST /api/uploads — guarda en disco y devuelve URL relativa
// ---------------------------------------------------------------
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Se requiere un archivo en el campo 'file'" });

  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({
    data: {
      fileId:   req.file.filename,
      filename: req.file.originalname,
      size:     req.file.size,
      mimetype: req.file.mimetype,
      url,
    },
  });
});

// ---------------------------------------------------------------
// GET /api/uploads — lista archivos del disco
// ---------------------------------------------------------------
router.get("/", (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR).map((name) => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, name));
      return { fileId: name, filename: name, size: stat.size, url: `/uploads/${name}`, fecha_subida: stat.mtime };
    });
    files.sort((a, b) => new Date(b.fecha_subida) - new Date(a.fecha_subida));
    res.json({ data: files, meta: { total: files.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// DELETE /api/uploads/:filename — elimina del disco
// ---------------------------------------------------------------
router.delete("/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Archivo no encontrado" });
  fs.unlinkSync(filePath);
  res.json({ data: { deleted: req.params.filename } });
});

module.exports = router;
