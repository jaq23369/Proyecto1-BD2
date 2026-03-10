# Frontend — Plan de Implementacion

## Stack
- Next.js 16.1.6 + TypeScript + React 19.2.3
- Tailwind CSS 4
- Framer Motion — animaciones de paginas, cards, modals, charts
- Lucide React — iconos SVG profesionales (sin emojis)
- Fetch API nativo con `credentials: "include"` para cookies httpOnly

## Dependencias a instalar

### Frontend
```bash
npm install framer-motion lucide-react
```

### Backend (auth)
```bash
npm install jsonwebtoken bcryptjs cookie-parser
```

---

## Cambios al backend-api (AUTH — antes de arrancar el frontend)

### Endpoints nuevos en `/backend-api/routes/auth.js`
```
POST /api/auth/register  → crea usuario con bcrypt hash, retorna JWT en cookie httpOnly
POST /api/auth/login     → verifica email+password, retorna JWT en cookie httpOnly
POST /api/auth/logout    → borra la cookie
GET  /api/auth/me        → verifica JWT, retorna payload del usuario
```

Payload JWT: `{ userId, email, nombre, tipo_usuario }`

Cookie:
```js
res.cookie("auth_token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
})
```

### Cambios en `server.js`
```js
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use("/api/auth", require("./routes/auth"));
```

### Nuevo `/backend-api/middleware/auth.js`
Middleware `verifyToken(req, res, next)` que lee `req.cookies.auth_token`,
verifica la firma JWT y popula `req.user`. Aplicar solo en rutas que lo requieran.

---

## Estructura de directorios

```
frontend/src/
├── app/
│   ├── layout.tsx                    # Root: AuthProvider + ToastProvider + AnimatePresence
│   ├── globals.css                   # Tailwind + CSS variables del tema
│   ├── page.tsx                      # Redirect a /restaurantes o /login
│   │
│   ├── (auth)/                       # Sin navbar
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── restaurantes/
│   │   ├── page.tsx                  # Grid con filtros, busqueda texto y geo
│   │   └── [id]/
│   │       ├── page.tsx              # Detalle + tabs Menu | Resenas
│   │       └── editar/page.tsx       # Solo admin
│   │
│   ├── menu-items/
│   │   ├── page.tsx                  # Lista global (admin) + bulk actions
│   │   └── [id]/page.tsx
│   │
│   ├── ordenes/
│   │   ├── page.tsx                  # Lista con filtros
│   │   ├── nueva/page.tsx            # Crear orden (carrito)
│   │   └── [id]/page.tsx             # Detalle + timeline + cambio estado
│   │
│   ├── resenas/
│   │   ├── page.tsx                  # Lista con filtros
│   │   └── nueva/page.tsx            # Crear resena
│   │
│   ├── usuarios/
│   │   ├── page.tsx                  # Lista (admin)
│   │   └── [id]/page.tsx             # Perfil + direcciones
│   │
│   ├── uploads/
│   │   └── page.tsx                  # Galeria GridFS + uploader (admin)
│   │
│   └── analytics/
│       └── page.tsx                  # Dashboard 5 pipelines (admin)
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx                # primary | secondary | ghost | danger
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx                 # AnimatePresence + scale animation
│   │   ├── Spinner.tsx               # Loader2 de Lucide + animate-spin
│   │   ├── Toast.tsx                 # Slide desde la derecha
│   │   ├── Pagination.tsx
│   │   ├── StarRating.tsx            # Star de Lucide, interactivo o display
│   │   └── EmptyState.tsx
│   │
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── PageWrapper.tsx           # motion.div con pageVariants
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   │
│   ├── restaurantes/
│   │   ├── RestauranteCard.tsx       # motion.div + whileHover={{ y: -4 }}
│   │   ├── RestauranteGrid.tsx       # staggerChildren
│   │   ├── RestauranteFilters.tsx    # texto, categoria, geo, estado
│   │   └── RestauranteForm.tsx
│   │
│   ├── menu/
│   │   ├── MenuItemCard.tsx
│   │   ├── MenuItemForm.tsx
│   │   ├── BulkDisableForm.tsx
│   │   └── BulkPriceForm.tsx
│   │
│   ├── ordenes/
│   │   ├── OrdenCard.tsx
│   │   ├── OrdenTimeline.tsx         # staggerChildren por estado
│   │   ├── OrdenForm.tsx             # seleccionar items, calcular total
│   │   └── EstadoBadge.tsx           # color por estado
│   │
│   ├── resenas/
│   │   ├── ResenaCard.tsx
│   │   ├── ResenaForm.tsx
│   │   └── AspectosRating.tsx
│   │
│   ├── usuarios/
│   │   ├── UsuarioCard.tsx
│   │   └── DireccionesManager.tsx   # $push / $pull
│   │
│   ├── uploads/
│   │   ├── FileUploader.tsx          # drag & drop → GridFS
│   │   └── FileGallery.tsx
│   │
│   └── analytics/
│       ├── BarChart.tsx              # barras CSS animadas (sin libreria externa)
│       ├── FunnelChart.tsx
│       ├── VentasPorMes.tsx
│       ├── TopProductos.tsx
│       ├── RatingChart.tsx
│       └── TiemposEstado.tsx
│
├── context/
│   ├── AuthContext.tsx
│   └── ToastContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useRequireAuth.ts
│   └── useToast.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts                 # fetch wrapper base con credentials: "include"
│   │   ├── auth.ts
│   │   ├── restaurantes.ts
│   │   ├── menuItems.ts
│   │   ├── ordenes.ts
│   │   ├── resenas.ts
│   │   ├── usuarios.ts
│   │   ├── uploads.ts
│   │   └── analytics.ts
│   └── utils.ts                      # cn(), formatCurrency(), formatDate(), variants
│
├── types/
│   └── index.ts                      # Todos los tipos del dominio
│
└── middleware.ts                     # Proteccion de rutas por cookie
```

---

## Paginas y endpoints que consume cada una

| Ruta | Acceso | Endpoints |
|---|---|---|
| `/login` | publico | `POST /api/auth/login` |
| `/register` | publico | `POST /api/auth/register` |
| `/restaurantes` | publico | `GET /api/restaurantes`, `GET /api/restaurantes/stats/categorias` |
| `/restaurantes/[id]` | publico | `GET /api/restaurantes/:id`, `GET /api/menu-items?restaurante_id=`, `GET /api/resenas?restaurante_id=` |
| `/restaurantes/[id]/editar` | admin | `PUT /api/restaurantes/:id`, `POST /api/restaurantes/:id/categorias` |
| `/menu-items` | admin | `GET /api/menu-items`, `POST`, `PUT`, `DELETE`, `PATCH /bulk-disable`, `PATCH /bulk-price` |
| `/ordenes` | auth | `GET /api/ordenes` |
| `/ordenes/nueva` | auth | `GET /api/restaurantes`, `GET /api/menu-items`, `POST /api/ordenes` |
| `/ordenes/[id]` | auth | `GET /api/ordenes/:id`, `PATCH /api/ordenes/:id` |
| `/resenas` | publico | `GET /api/resenas` |
| `/resenas/nueva` | auth | `GET /api/ordenes?usuario_id=`, `POST /api/resenas` |
| `/usuarios` | admin | `GET /api/usuarios`, `GET /api/usuarios/stats/count`, `DELETE /api/usuarios/inactive` |
| `/usuarios/[id]` | auth | `GET /api/usuarios/:id`, `PUT`, `POST /direcciones`, `DELETE /direcciones/:alias` |
| `/uploads` | admin | `GET /api/uploads`, `POST /api/uploads`, `DELETE /api/uploads/:id` |
| `/analytics` | admin | `GET /api/analytics/*` (5 endpoints) |

---

## Estrategia de Auth

1. `POST /api/auth/login` → backend setea cookie `auth_token` httpOnly
2. `AuthContext` monta y llama `GET /api/auth/me` con `credentials: "include"`
3. Si 200 → `user` populado en contexto. Si 401 → `user = null`
4. `middleware.ts` de Next.js lee la cookie y redirige si no existe
5. Cada request usa `credentials: "include"` para enviar la cookie automaticamente

### Rutas protegidas (middleware.ts)
- `/ordenes/*`, `/resenas/nueva/*`, `/usuarios/*`, `/uploads/*`, `/analytics/*`, `/menu-items/*`

---

## Animaciones (Framer Motion)

```typescript
// Variants reutilizables en lib/utils.ts
export const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const listVariants = {
  visible: { transition: { staggerChildren: 0.06 } },
};

export const cardVariants = {
  hidden:  { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};
```

- `PageWrapper` — fade+slide en cada navegacion
- Cards — stagger en listas, `whileHover={{ y: -4 }}`
- Modal — scale + opacity con `AnimatePresence`
- Toast — slide desde la derecha
- BarChart analytics — `width` desde 0 al valor con `whileInView`
- OrdenTimeline — stagger por cada paso del historial

---

## Notas tecnicas importantes

- `credentials: "include"` obligatorio en todos los fetch del cliente
- `cors` del backend con `origin: "http://localhost:3000"` y `credentials: true`
- Imagenes de GridFS: `src="http://localhost:4000/api/uploads/{fileId}"` — agregar `remotePatterns` en `next.config.ts`
- IDs de MongoDB llegan como string en JSON — tipificar siempre como `string`
- El campo `password_hash` se agrega en `POST /api/auth/register`, no en `POST /api/usuarios`
- `middleware.ts` de Next.js corre en Edge — solo puede leer la cookie, no verificar JWT. La verificacion real la hace el backend en cada request
