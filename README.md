# Personal Stock Management

Personal Stock Management is a small full‑stack warehouse tracker that lets registered users manage multiple stock locations, categories, and products. The frontend is a React (Vite) single‑page app, while the backend is a Go Fiber API backed by MongoDB. Docker assets are included for containerized deployments.

## Features

- Email/password authentication with hashed credentials, local session caching, and admin/dashboard routes.
- Warehouse inventory flows: create/delete stocks, browse per-user warehouses, drill into products by stock, and manage categories tied to a stock.
- Product management APIs to create, update, delete, and list stock items with quantities and units.
- Category management APIs with cascading clean-up for related products.
- Auto-generated Swagger docs (`/swagger/index.html`) for all public HTTP endpoints.
- Dockerfiles and compose setup for building both the Go API and the React + Nginx static site.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, CSS modules, localStorage session cache.
- **Backend:** Go 1.24, Fiber v2, MongoDB Go driver, bcrypt auth, Swagger.
- **Infrastructure:** Docker, docker-compose, Nginx static hosting.

## Project Layout

```text
personal-stock-management/
├── backend/           # Go Fiber API and Swagger docs
├── frontend/          # React + Vite application
├── deploy/            # Dockerfiles, nginx config, compose file
├── tmp/               # Scratch space (git-ignored)
└── README.md          # This file
```

## Prerequisites

- Go **1.24+**
- Node.js **18+** (for React 19 + Vite)
- npm **10+**
- MongoDB instance (local or managed)
- Docker 24+ (optional, for containerized workflows)

## Backend (Go Fiber API)

```bash
cd backend
go mod download
go run .
```

Before running, create `backend/.env` or export the variables yourself:

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URL` | MongoDB connection string with credentials. | – |
| `MONGO_DB_NAME` | Database name for all collections. | `perosnal_stock_manage` |

The API serves on `http://localhost:8080` by default. Swagger docs are available at `http://localhost:8080/swagger/index.html`.

## Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev            # serves on http://localhost:5173
```

Vite expects a backend origin configured in `frontend/.env` (anything starting with `VITE_` is exposed to the client):

```ini
VITE_BACKEND_IP=http://localhost:8080
```

Build for production with `npm run build`, Build for developing with `npm run dev`

## Docker & Deployment

The `deploy/docker-compose.yml` file builds both services. From the repo root:

```bash
cd deploy
docker compose up --build
```

Create or edit `deploy/.env` to define Mongo credentials, host ports, and build-time overrides before starting the stack.

Key environment values consumed by the compose stack:

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_PORT` | Host port mapped to Fiber’s `:8080`. | `8080` |
| `FRONTEND_PORT` | Host port mapped to Nginx `:80`. | `3000` |
| `FRONTEND_BACKEND_IP` | Backend URL baked into the frontend image. | `localhost:3000` |
| `MONGO_URL` / `MONGO_DB_NAME` | Same as dev setup. | `mongodb://mongo:27017` / `personal_stock_manage` |

> **Note:** The compose file assumes a reachable MongoDB instance referenced by `MONGO_URL`. Add a `mongo` service or point to an external cluster before running `docker compose up`.

## API Surface

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health probe for uptime checks. |
| `POST` | `/api/register` | Register a new user (hashes password, enforces unique email). |
| `POST` | `/api/login` | Authenticate by email/password. |
| `GET` | `/api/warehouse?userId=` | List stocks owned by a user. |
| `POST` | `/api/warehouse` | Create a stock for a user. |
| `DELETE` | `/api/warehouse/:stockId` | Delete a stock and cascade delete products. |
| `GET` | `/api/products?stockId=` | List products belonging to a stock. |
| `POST` | `/api/products` | Create a product record. |
| `PUT` | `/api/products/:productId` | Update product properties. |
| `DELETE` | `/api/products/:productId` | Remove a product. |
| `GET` | `/api/categories?stockId=` | List categories for a stock. |
| `POST` | `/api/categories` | Bulk create categories. |
| `DELETE` | `/api/categories/:categoryId` | Delete a category and null category references on products. |

Refer to the in-repo Swagger spec (`backend/docs/swagger.yaml`) for payload schemas and responses.

## Useful Commands

| Context | Command | Description |
|---------|---------|-------------|
| Backend | `go run .` | Start Fiber API locally. |
| Backend | `go build ./...` | Compile the API. |
| Frontend | `npm run dev` | Start Vite dev server with HMR. |
| Frontend | `npm run build` | Produce production assets (consumed by `deploy/nginx.Dockerfile`). |
| Frontend | `npm run lint` | Run ESLint/TypeScript checks. |
| Docker | `docker compose up --build` | Build and run backend + frontend containers. |
