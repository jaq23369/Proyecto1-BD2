const { Router }   = require("express");
const { getDb }    = require("../lib/mongodb");
const bcrypt       = require("bcryptjs");
const jwt          = require("jsonwebtoken");
const { SECRET }   = require("../middleware/auth");

const router   = Router();
const COOKIE   = "auth_token";
const MAX_AGE  = 7 * 24 * 60 * 60 * 1000; // 7 dias

function makeToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, nombre: user.nombre, tipo_usuario: user.tipo_usuario },
    SECRET,
    { expiresIn: "7d" }
  );
}

function setCookie(res, token) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   MAX_AGE,
  });
}

// ---------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------
router.post("/register", async (req, res) => {
  try {
    const db   = await getDb();
    const { nombre, email, password, tipo_usuario } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "nombre, email y password son obligatorios" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "password debe tener al menos 6 caracteres" });
    }

    const exists = await db.collection("usuarios").findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(400).json({ error: "El email ya esta registrado" });

    const password_hash = await bcrypt.hash(password, 10);

    const doc = {
      tipo_usuario:        tipo_usuario === "admin" ? "admin" : "cliente",
      nombre:              nombre.trim(),
      email:               email.toLowerCase().trim(),
      telefono:            req.body.telefono || "",
      estado:              "activo",
      password_hash,
      direccion_principal: req.body.direccion_principal || {},
      direcciones:         [],
      preferencias:        { idioma: "es", notificaciones: true },
      fecha_creacion:      new Date(),
      fecha_actualizacion: new Date(),
    };

    const result = await db.collection("usuarios").insertOne(doc);
    doc._id = result.insertedId;

    const token = makeToken(doc);
    setCookie(res, token);
    res.status(201).json({
      data: { userId: result.insertedId, nombre: doc.nombre, email: doc.email, tipo_usuario: doc.tipo_usuario },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const db = await getDb();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email y password son obligatorios" });
    }

    const user = await db.collection("usuarios").findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales incorrectas" });

    if (user.estado !== "activo") {
      return res.status(403).json({ error: "Cuenta inactiva" });
    }

    const token = makeToken(user);
    setCookie(res, token);
    res.json({
      data: { userId: user._id, nombre: user.nombre, email: user.email, tipo_usuario: user.tipo_usuario },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: "lax" });
  res.json({ data: { message: "Sesion cerrada" } });
});

// ---------------------------------------------------------------
// GET /api/auth/me  — verifica JWT y retorna payload
// ---------------------------------------------------------------
router.get("/me", (req, res) => {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    const payload = jwt.verify(token, SECRET);
    res.json({ data: { userId: payload.userId, nombre: payload.nombre, email: payload.email, tipo_usuario: payload.tipo_usuario } });
  } catch {
    res.status(401).json({ error: "Token invalido o expirado" });
  }
});

module.exports = router;
