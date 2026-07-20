# FITGEAR

FITGEAR es una tienda de articulos fitness con frontend en React y TanStack Start (SSR sobre Vite), backend en Hono sobre Bun, persistencia en MongoDB, autenticacion con Clerk y flujo de checkout con Stripe. El proyecto separa claramente la capa de presentacion, el consumo de API y la logica del backend para catalogo, carrito, pedidos, usuarios, pagos y administracion.

## Descripcion del proyecto

La aplicacion permite navegar un catalogo real de productos, filtrar por categorias, ver detalle de producto, gestionar el carrito, crear pedidos y completar pagos por Stripe. El frontend consume la API del backend en tiempo real y la informacion principal vive en MongoDB. Cuando el backend responde correctamente, el catalogo se alimenta de datos reales; el fallback local solo existe como respaldo ante errores criticos.

## Demo en produccion

| Capa | URL |
|---|---|
| Frontend (Vercel) | https://semestralfirgear.vercel.app |
| Backend / API (Render) | https://fitgear-backend.onrender.com/api |

> El backend en Render usa el plan gratuito: tras un rato de inactividad se "duerme" y la primera peticion puede tardar ~30-50s en responder mientras el contenedor vuelve a arrancar. `GET /api/health` es una sonda de liveness util para despertarlo.

## Credenciales de prueba (revision del profesor)

Cuenta de prueba con rol admin para revisar el panel de administracion y el flujo completo de la tienda.

| Campo | Valor |
|---|---|
| Email | fabiherna14@gmail.com |
| Password | GabiEric14 |

> Ambos repos son publicos. Estas credenciales corresponden a una cuenta de prueba dedicada; no reutilices esta contrasena en cuentas reales.

## Tecnologias usadas

**Frontend**

- React 19
- Vite
- TypeScript
- TanStack Start (SSR) + TanStack Router
- TanStack React Query
- Clerk (autenticacion)
- Stripe.js / Stripe Elements (checkout embebido)
- Framer Motion + GSAP (animaciones)
- Tailwind CSS v4

**Backend**

- Hono (framework HTTP)
- Bun (runtime)
- MongoDB con Mongoose
- Clerk (verificacion de JWT)
- Stripe (pagos, webhooks, reembolsos)
- SendGrid (emails transaccionales)
- Cloudinary (almacenamiento de imagenes de producto)
- Zod (validacion)

**Infraestructura y tooling**

- Docker / Docker Compose
- Vercel (frontend, via plugin Nitro) + Render (backend, Docker)
- GitHub Actions (CI: typecheck, tests, Playwright)
- Vitest (unit tests frontend) + Bun test (backend/MCP) + Playwright (e2e)
- PostHog (monitoreo de errores y analitica, opcional)
- Servidor MCP (Model Context Protocol)

## Requisitos previos

- Node.js 20 o superior
- npm
- Bun instalado para ejecutar el backend en modo desarrollo
- MongoDB local o remota accesible por red
- Cuenta y claves de Clerk para autenticacion
- Cuenta y claves de Stripe para checkout
- (Opcional) Cuenta de Cloudinary — sin ella, subir imagenes de producto falla
- (Opcional) API key de SendGrid — sin ella, los emails no se envian, solo se registran en logs
- (Opcional) Docker + Docker Compose para levantar todo el stack

## Instalacion

1. Instala dependencias del frontend en la raiz del proyecto:

```bash
npm install
```

2. Instala dependencias del backend:

```bash
cd backend
bun install   # o: npm install
```

3. Copia los archivos de ejemplo de variables de entorno y completa los valores reales (ver la seccion siguiente):

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

## Variables de entorno

La fuente de verdad son los dos archivos de ejemplo, ambos con comentarios que explican cada variable:

- [`.env.example`](.env.example) — raiz (frontend Vite + docker-compose)
- [`backend/.env.example`](backend/.env.example) — backend fuera de Docker

Ambos `.env` estan gitignoreados: **nunca commitees credenciales reales.**

### Frontend (`.env` en la raiz)

| Variable | Uso |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clave publica de Clerk (cliente) |
| `CLERK_PUBLISHABLE_KEY` | Copia sin prefijo `VITE_`, leida por el middleware SSR de Clerk |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave publica de Stripe — checkout embebido (Stripe Elements) |
| `VITE_API_BASE_URL` | Base URL del backend, p.ej. `http://localhost:4000/api` |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | PostHog (opcional; si falta, degrada sin romper) |

### Backend (`backend/.env`)

| Variable | Uso |
|---|---|
| `PORT` | Puerto del backend (default `4000`) |
| `MONGODB_URI` | Conexion a MongoDB (Atlas compartida o local) |
| `CLERK_SECRET_KEY` | Clave secreta de Clerk (verificacion de sesion) |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe (modo test) |
| `STRIPE_WEBHOOK_SECRET` | Secret del webhook (`stripe listen --print-secret` o el Dashboard) |
| `FRONTEND_URL` | Origen permitido por CORS — **debe ser** `http://localhost:3000` (ver gotcha abajo) |
| `BACKEND_URL` | URL publica del backend |
| `SENDGRID_API_KEY` | SendGrid (opcional; sin ella los emails NO se envian, solo se loguean) |
| `EMAIL_FROM` | Remitente **verificado** en SendGrid (Single Sender Verification) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Almacenamiento de imagenes de producto |
| `POSTHOG_API_KEY` / `POSTHOG_HOST` | PostHog backend (opcional) |

> **Importante — `FRONTEND_URL` debe ser `http://localhost:3000`.** Tras la migracion a TanStack Start el frontend corre en el puerto **3000** (antes era `5173` con el SPA de Vite). El backend usa `FRONTEND_URL` para su politica de CORS: si esta linea quedo en `5173`, el navegador bloquea **todas** las llamadas del frontend por CORS y veras el catalogo vacio ("No hay productos") y la vista de cliente aunque tu cuenta sea ADMIN. El backend NO recarga el `.env` en caliente: reinicialo tras el cambio.

> **Degradacion graciosa.** SendGrid, Cloudinary y PostHog son opcionales en dev: si su clave falta o esta vacia, esa integracion se desactiva sin romper el arranque (los emails se registran en logs en vez de enviarse, etc.). En **produccion** si deben estar configuradas para que emails e imagenes funcionen de verdad.

## Como ejecutar frontend y backend

### Frontend

Desde la raiz del proyecto:

```bash
npm run dev
```

Disponible en `http://localhost:3000/`.

### Backend

Desde la carpeta `backend`:

```bash
cd backend
bun --watch src/server.ts   # o: bun run dev
```

Disponible en `http://localhost:4000/`.

## Ejecutar con Docker Compose

El [`docker-compose.yml`](docker-compose.yml) levanta **tres** servicios: **MongoDB**, el **backend** y el **frontend** (a diferencia de correrlos a mano, aqui compose tambien construye y sirve el frontend). Requiere Docker y un `.env` en la raiz con las variables que compose inyecta a los contenedores (Stripe, Clerk, SendGrid, Cloudinary, PostHog y las `VITE_*`).

```bash
docker compose up --build
```

Frontend en `http://localhost:3000`, backend en `http://localhost:4000`, MongoDB en `27017`.

> **Las `VITE_*` se hornean en build-time.** El servicio `frontend` recibe las `VITE_*` como build `args` (no como `environment`), porque Vite las incrusta en el bundle del cliente durante `npm run build`. Si cambias una, reconstruye la imagen: `docker compose build frontend` — reiniciar el contenedor no basta.

> **Docker usa una MongoDB local, no la de Atlas.** `docker-compose.yml` apunta `MONGODB_URI` al contenedor de Mongo local (vacio al inicio), asi que con Docker **no** veras el catalogo ni los usuarios de la Atlas compartida. Para trabajar contra Atlas, corre el backend fuera de Docker (`cd backend && bun --watch src/server.ts`, que lee `backend/.env`) o crea un `docker-compose.override.yml` local con tu `MONGODB_URI` de Atlas.

## Testing

El proyecto tiene tres capas de pruebas:

```bash
# Unit tests del frontend (Vitest)
npm test

# Unit tests del backend (Bun test)
cd backend && bun test

# Unit tests del servidor MCP (Bun test)
cd mcp-server && bun test

# End-to-end (Playwright) — desde la raiz
npm run test:e2e            # corre e2e/public y e2e/authenticated
npm run test:e2e:ui        # runner interactivo
npm run test:e2e:report    # abre el ultimo reporte HTML
```

Los tests e2e se dividen en `e2e/public/` (sin sesion) y `e2e/authenticated/` (requieren credenciales de Clerk configuradas). Ver [`docs/e2e-testing.md`](docs/e2e-testing.md) para el detalle.

## Integracion continua (CI)

`.github/workflows/ci.yml` corre en cada `push` y `pull_request` contra `main`, con cinco jobs:

- **Frontend** — typecheck + unit tests (Vitest)
- **Backend** — unit tests (Bun)
- **MCP server** — unit tests (Bun)
- **Playwright (e2e/public)** — sin credenciales
- **Playwright (e2e/authenticated)** — requiere secrets de Clerk/Stripe

## Despliegue en produccion

El despliegue vive en **dos plataformas**, alimentadas desde la rama `desplegar` (que anade config especifica de deploy sobre `main`):

- **Frontend → Vercel.** Vercel autodetecta TanStack Start + Nitro (plugin `nitro()` en `vite.config.ts`) y construye el SSR sin config extra.
- **Backend → Render.** Servicio Docker declarado en `render.yaml` (variables de entorno via el dashboard de Render, `sync: false`).

> Los archivos de deploy (`render.yaml`, plugin `nitro` en `vite.config.ts`) viven solo en la rama `desplegar` y divergen de `main` a proposito.

## Estructura del proyecto

```text
.
├── app/                  # TanStack Start: rutas (app/routes/**), guards (app/lib/**), SSR
├── src/                  # Frontend React
│   ├── api/              # apiClient.ts, fitgearApi.ts (consumo de la API)
│   ├── components/       # UI (catalogo, carrito, checkout, admin, orders, ui)
│   ├── context/          # AuthContext, CartContext
│   ├── data/             # fallback local del catalogo
│   ├── hooks/            # hooks compartidos (useAddToCart, useAdminNotice, ...)
│   ├── lib/              # helpers (cartReducer, motion, queryKeys, ...)
│   ├── pages/            # paginas
│   └── utils/            # formato, estilos de estado, etc.
├── backend/              # API Hono sobre Bun
│   ├── src/
│   │   ├── app.ts, server.ts
│   │   ├── config/ controllers/ middlewares/ models/
│   │   ├── routes/ services/ utils/ validations/
│   │   └── scripts/      # migraciones (imagenes -> Cloudinary)
│   ├── Dockerfile
│   └── package.json
├── mcp-server/           # Servidor MCP (tools para agentes), reutiliza backend/src
├── e2e/                  # Playwright: public/ authenticated/ fixtures/ support/
├── docs/                 # design.md, voz-y-tono.md, e2e-testing.md, mcp/registry.md
├── scripts/              # utilidades (check-contrast.mjs)
├── public/
├── .github/workflows/    # ci.yml
├── Dockerfile            # imagen del frontend (SSR)
├── docker-compose.yml
├── vite.config.ts
└── README.md
```

## Funcionalidades principales

- Catalogo de productos con busqueda, filtros, ordenamiento y autocompletado.
- Fallback local de respaldo solo ante errores criticos.
- Detalle de producto con informacion, galeria y relacionados.
- Reseñas de productos por compradores verificados, con moderacion de administrador.
- Carrito con ajuste de cantidades, subtotal, impuestos y envio, con feedback visual al agregar.
- Creacion de pedidos reales en backend.
- Checkout con Stripe Elements embebido, confirmacion de pago, envios y reembolsos.
- Emails transaccionales: confirmacion de compra, orden enviada y orden entregada (SendGrid).
- Cancelacion/devolucion de pedidos por el cliente (auto-reembolso via Stripe).
- Login y autenticacion con Clerk.
- Panel de administracion (dashboard ejecutivo) para catalogo, categorias, usuarios y pedidos.
- Alertas de stock bajo para el administrador.
- Historial de auditoria de acciones de administrador (solo lectura).
- Reporte de inventario exportable en CSV y PDF.
- Servidor MCP que expone la logica de negocio como herramientas para agentes.

## Integraciones

### Stripe

Checkout embebido con Stripe Elements: el backend crea y confirma PaymentIntents, procesa webhooks para marcar pedidos como pagados, y maneja reembolsos (admin y auto-servicio del cliente).

### Clerk

Autenticacion y sincronizacion de usuarios hacia el backend; verificacion de JWT en la API.

### MongoDB y Mongoose

Persisten productos, categorias, usuarios, pedidos, eventos de webhook, historial de ordenes y logs de notificaciones.

### SendGrid

Emails transaccionales (compra confirmada, enviada, entregada, reembolso, stock bajo). Degrada a logs si no hay API key.

### Cloudinary

Almacenamiento de imagenes de producto (reemplaza el disco local del backend).

### API del backend

El frontend consume la API mediante `src/api/apiClient.ts` y `src/api/fitgearApi.ts`, con base URL configurable por `VITE_API_BASE_URL`.

### Servidor MCP

El paquete `mcp-server/` expone la logica de negocio del backend como herramientas para agentes (Claude Code, Codex, etc.) sobre transporte stdio, reutilizando los services/models/middlewares de `backend/src/`. Cubre catalogo, ordenes, metricas, inventario, categorias, reseñas y auditoria. Detalle de cada tool en [`docs/mcp/registry.md`](docs/mcp/registry.md) y guia de uso en [`mcp-server/README.md`](mcp-server/README.md).

## Documentacion adicional

- [`docs/design.md`](docs/design.md) — sistema de diseño (tokens, tipografia, motion).
- [`docs/voz-y-tono.md`](docs/voz-y-tono.md) — guia de voz, tono y microcopy.
- [`docs/e2e-testing.md`](docs/e2e-testing.md) — como correr y estructurar los tests e2e.
- [`docs/mcp/registry.md`](docs/mcp/registry.md) — registro de las herramientas del servidor MCP.

## Scripts disponibles

### Raiz del proyecto

```bash
npm run dev            # servidor de desarrollo (SSR) en http://localhost:3000
npm run build          # build de produccion + typecheck (vite build && tsc --noEmit)
npm run start          # sirve el build de produccion (vite preview)
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm test               # unit tests (Vitest)
npm run test:e2e       # Playwright (public + authenticated)
npm run test:e2e:ui    # Playwright runner interactivo
npm run test:e2e:report# abre el ultimo reporte de Playwright
npm run audit:contrast # verifica contraste de colores
```

### Backend

```bash
cd backend
bun run dev                       # bun --watch src/server.ts
bun run start                     # bun src/server.ts
bun test                          # unit tests
bun run migrate:cloudinary-images # migracion de imagenes a Cloudinary
```

## Solucion de problemas comunes

### El frontend no carga el catalogo

- Verifica que el backend este corriendo en `http://localhost:4000`.
- Revisa que `VITE_API_BASE_URL` apunte a `http://localhost:4000/api`.
- Confirma que `FRONTEND_URL` en el backend sea `http://localhost:3000` (CORS).
- Confirma que MongoDB este activo y que `MONGODB_URI` sea valido.

### El backend no inicia

- Verifica que Bun este instalado.
- Revisa `backend/.env`.
- Confirma que el puerto `4000` no este ocupado.

### MongoDB no conecta

- Asegurate de que el servicio MongoDB este levantado.
- Revisa que la URI corresponda a tu entorno (Atlas vs local).
- Si usas Docker, recuerda que apunta a un Mongo local vacio.

### Stripe no crea checkout

- Revisa que `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y `VITE_STRIPE_PUBLISHABLE_KEY` esten configuradas.
- Confirma que el backend tenga acceso a Internet y credenciales validas.

### No llegan los emails

- `SENDGRID_API_KEY` debe estar seteada (sin ella el backend solo loguea, no envia).
- `EMAIL_FROM` debe ser un remitente **verificado** en SendGrid (Single Sender Verification), o SendGrid rechaza el envio.
- En produccion, confirma que el deploy del backend este realmente actualizado con el ultimo codigo.

### No se suben imagenes de producto

- Verifica las tres variables `CLOUDINARY_*`.

### Clerk no autentica

- Revisa `VITE_CLERK_PUBLISHABLE_KEY` en el frontend.
- Confirma que la instancia de Clerk permita `http://localhost:3000`.

## Estado actual del proyecto

- Frontend y backend desplegados en produccion (Vercel + Render).
- Catalogo, carrito, checkout con Stripe, panel de administracion y servidor MCP operativos.
- Suite de pruebas (Vitest, Bun test, Playwright) integrada en CI (GitHub Actions).
- Emails transaccionales, almacenamiento de imagenes (Cloudinary) y monitoreo (PostHog) integrados.

## Proximos pasos opcionales

- Ampliar la cobertura de tests e2e a mas flujos autenticados.
- Reducir el tamaño del bundle principal mediante code splitting.
- Añadir un seed controlado para entornos limpios de desarrollo.
