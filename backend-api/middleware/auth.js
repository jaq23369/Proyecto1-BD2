const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "bd2_proyecto_secret_2026";

function verifyToken(req, res, next) {
  const token = req.cookies && req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "No autenticado" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalido o expirado" });
  }
}

function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.tipo_usuario !== "admin") {
      return res.status(403).json({ error: "Se requiere rol admin" });
    }
    next();
  });
}

module.exports = { verifyToken, verifyAdmin, SECRET };
