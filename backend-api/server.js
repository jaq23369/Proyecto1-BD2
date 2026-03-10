require("dotenv").config();
const path         = require("path");
const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");

const authRouter        = require("./routes/auth");
const restaurantesRouter = require("./routes/restaurantes");
const usuariosRouter     = require("./routes/usuarios");
const menuItemsRouter    = require("./routes/menu-items");
const ordenesRouter      = require("./routes/ordenes");
const resenasRouter      = require("./routes/resenas");
const uploadsRouter      = require("./routes/uploads");
const analyticsRouter    = require("./routes/analytics");

const app = express();

app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.use("/api/auth",        authRouter);
app.use("/api/restaurantes", restaurantesRouter);
app.use("/api/usuarios",     usuariosRouter);
app.use("/api/menu-items",   menuItemsRouter);
app.use("/api/ordenes",      ordenesRouter);
app.use("/api/resenas",      resenasRouter);
app.use("/api/uploads",      uploadsRouter);
app.use("/api/analytics",    analyticsRouter);

app.get("/", (req, res) => {
  res.json({ message: "API Restaurantes BD2 funcionando", version: "1.0.0" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
