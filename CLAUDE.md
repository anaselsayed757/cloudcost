# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

CloudCost Monitor is a cloud VM cost tracking system. It pulls live CPU/RAM/network metrics from Prometheus (via node-exporter), calculates hourly billing per VM against configurable tariffs, and surfaces costs, budgets, forecasts, and alerts in a React dashboard.

## Running the stack

Everything runs in Docker Compose:

```bash
docker compose up -d          # start all services
docker compose logs -f backend  # tail backend logs
docker compose restart backend  # apply backend code changes
```

The backend auto-creates all database tables on startup via SQLAlchemy's `create_all` — there are no Alembic migration files.

## Running tests

Tests live in `backend/tests/` and run inside or outside Docker:

```bash
cd backend
pip install -r requirements.txt
pytest tests/                        # all tests
pytest tests/test_auth.py            # single file
pytest tests/test_billing.py -v      # verbose
```

`conftest.py` sets `SECRET_KEY` before any app module loads — this is required because `app/auth.py` raises `RuntimeError` at import time if `SECRET_KEY` is missing.

## Frontend development

The frontend is Vite + React (no TypeScript, no state management library):

```bash
cd frontend
npm install
npm start    # dev server on :3000
npm run build
```

In dev mode, Vite proxies `/api/*` → `http://backend:8000/*` (stripping the `/api` prefix). In production (Docker), nginx serves the built static files and proxies `/api` the same way. The frontend never calls the backend directly by hostname — always through `/api`.

## Service ports

| Port | Service |
|------|---------|
| 3000 | Frontend |
| 3001 | Grafana |
| 8000 | Backend API (`/docs` for Swagger UI) |
| 8025 | Mailhog web UI |
| 9090 | Prometheus |
| 9100 | Node Exporter metrics |
| 5432 | PostgreSQL (TCP only, no browser) |
| 1025 | Mailhog SMTP (TCP only, no browser) |

## Architecture

### Data flow

1. **Prometheus** scrapes node-exporter every 15 seconds from targets defined in `prometheus/prometheus.yml`.
2. **Backend scheduler** (`app/scheduler.py`) runs `run_billing()` every hour: queries Prometheus for CPU/RAM/network usage per VM, multiplies by the VM's tariff rates, and writes a `CostRecord` row to PostgreSQL.
3. **Frontend** polls the backend REST API to display costs, forecasts, and alerts. VM list is refreshed every 60 seconds via `usePolling`.

### Backend structure

- `app/main.py` — FastAPI app setup, CORS, rate limiting (slowapi), router registration, startup hook
- `app/models.py` — SQLAlchemy models: `VM`, `Tariff`, `CostRecord`, `Budget`, `Alert`, `User`
- `app/database.py` — async SQLAlchemy engine; `init_db()` creates tables on startup
- `app/prometheus_client.py` — thin wrapper around Prometheus HTTP API; all PromQL lives here
- `app/auth.py` — JWT creation/validation, `get_current_user` and `require_admin` FastAPI dependencies
- `app/scheduler.py` — APScheduler async job for hourly billing
- `app/email_service.py` — SMTP email sender (MailHog in dev, configurable for prod)
- `app/api/` — one file per router: `auth`, `metrics`, `billing`, `forecast`, `alerts`, `vms`

### Authentication

JWT tokens with 24-hour expiry, signed with `SECRET_KEY`. Two roles: `admin` (full access) and `viewer` (read-only). Token is stored in `localStorage` and sent as a `Bearer` header. A 401 response anywhere in the API clears localStorage and reloads the page.

The first admin is bootstrapped by calling `POST /auth/setup-admin` (uses `ADMIN_DEFAULT_PASSWORD` from env).

### VM discovery

VMs are not manually registered — they come from Prometheus scrape targets. `prometheus_client.get_all_instances()` queries `up{job="vm-targets"}` and `up{job="main-server"}`. The `vms` table stores metadata (label, tariff, owner email, CPU cores, RAM) keyed by the Prometheus `instance` label (e.g. `10.150.40.20:9100`).

### Billing calculation

Cost per hour = `(metric_pct / 100) × resource_size × rate`:
- CPU: `cpu_pct × cpu_cores × cpu_rate_per_core_hour`
- RAM: `ram_pct × ram_gb × ram_rate_per_gb_hour`
- Network: `network_bytes_per_sec / 1GB × network_rate_per_gb`

### Forecasting

`app/api/forecast.py` loads the last 30 days of `CostRecord` rows for a VM and fits a time-series model (statsmodels/scikit-learn) to project the next 30 days.

## Environment variables

Copy `.env.example` to `.env`. The only required variable with no default is `SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

`ALLOWED_ORIGINS` must include the frontend URL (comma-separated) if the frontend runs on a different origin than the default `http://localhost:3000`.
