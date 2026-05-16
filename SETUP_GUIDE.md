# CloudCost — Setup & Installation Guide

## Prerequisites

### System requirements
- **OS**: Linux, macOS, or Windows with WSL2
- **CPU**: 2 cores minimum
- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk**: 10 GB free

### Required software
- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 1.29+

```bash
docker --version          # Docker version 20.10+
docker compose version    # Docker Compose version 2.x
```

---

## Installation

### 1. Clone the repository
```bash
git clone <repo-url>
cd cloudcost
```

### 2. Create the environment file
```bash
cp .env.example .env
```

Open `.env` and set a strong `SECRET_KEY`:
```bash
# Generate a secure key
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Paste the output as the `SECRET_KEY` value in `.env`. This is **required** — the backend will refuse to start without it.

The other defaults in `.env` work for local development as-is (MailHog for email, clouduser/cloudpass for PostgreSQL).

### 3. Build and start all services
```bash
docker compose up -d --build
```

This starts 7 services: node-exporter, prometheus, postgres, backend, frontend, mailhog, grafana.

Verify they're all running:
```bash
docker compose ps
```

First start takes 3–5 minutes while images download and the backend installs Python dependencies.

### 4. Bootstrap the admin account (first time only)
```bash
curl -X POST http://localhost:8000/auth/setup-admin
```

Expected response:
```json
{ "status": "admin created", "username": "admin" }
```

Default credentials: `admin` / `cloudcost2024` (set via `ADMIN_DEFAULT_PASSWORD` in `.env`).

### 5. Seed default tariffs
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d "username=admin&password=cloudcost2024" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -s -X POST http://localhost:8000/vms/seed \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Open the dashboard
- **Frontend**: http://localhost:3000 — log in with `admin` / `cloudcost2024`
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 — log in with `admin` / `cloudcost2024`
- **MailHog (email preview)**: http://localhost:8025

---

## First use

### Run your first billing cycle
In the dashboard, click **Run Billing Now** (admin button in the header area). This queries Prometheus for live CPU, RAM, and network metrics and creates cost records for all discovered VMs.

Or via API:
```bash
curl -s -X POST http://localhost:8000/billing/run \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Check alerts
Click **Check Alerts** to scan for idle VMs. If any VM has CPU < 5%, RAM < 20%, and network < 10 KB/s for 2+ hours, a warning alert fires and an email is sent to the VM's `owner_email`.

---

## Environment variables reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | **Yes** | — | JWT signing key. Generate with `secrets.token_hex(32)` |
| `POSTGRES_USER` | No | `clouduser` | PostgreSQL username |
| `POSTGRES_PASSWORD` | No | `cloudpass` | PostgreSQL password |
| `POSTGRES_DB` | No | `cloudcost` | Database name |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS whitelist (comma-separated) |
| `DASHBOARD_URL` | No | `http://localhost:3000` | URL shown in alert emails |
| `SMTP_HOST` | No | `mailhog` | SMTP server hostname |
| `SMTP_PORT` | No | `1025` | SMTP port |
| `SMTP_USER` | No | *(empty)* | SMTP username (blank = no auth) |
| `SMTP_PASSWORD` | No | *(empty)* | SMTP password |
| `ADMIN_DEFAULT_PASSWORD` | No | `cloudcost2024` | Initial admin password |
| `GF_SECURITY_ADMIN_PASSWORD` | No | `cloudcost2024` | Grafana admin password |

### Production Gmail SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your_16_char_app_password
```
Use a [Gmail App Password](https://support.google.com/accounts/answer/185833) — not your account password.

---

## Troubleshooting

### Backend won't start
```
RuntimeError: SECRET_KEY environment variable must be set
```
The `.env` file is missing or `SECRET_KEY` is empty. Copy `.env.example` to `.env` and set the key.

---

### Frontend shows blank page / API errors
The frontend proxies all API calls through Nginx to the backend (`/api/*` → `backend:8000/*`). Check:
```bash
docker compose logs backend --tail=50
docker compose logs frontend --tail=20
curl http://localhost:8000/health
```

---

### No VMs appear in the dashboard
VMs are auto-discovered from Prometheus on first load. Check Prometheus is scraping:
- Open http://localhost:9090/targets
- All targets should show **UP**

If node-exporter is not listed, check `prometheus/prometheus.yml`.

---

### No billing data / charts empty
Run a manual billing cycle first (see "First use" above). The automatic hourly scheduler runs billing every hour, but you need at least a few records before charts render.

---

### Database connection error
```bash
docker compose logs postgres --tail=20
docker compose restart postgres
# Wait 10 seconds, then:
docker compose restart backend
```

---

### Clear everything and start fresh
```bash
# Stops containers AND removes volumes (all data lost)
docker compose down -v

# Rebuild and restart
docker compose up -d --build
```

---

## Production checklist

Before deploying in any real environment:

- [ ] Set a strong random `SECRET_KEY` (`secrets.token_hex(32)`)
- [ ] Change `POSTGRES_PASSWORD` to a strong unique password
- [ ] Change `ADMIN_DEFAULT_PASSWORD`
- [ ] Change `GF_SECURITY_ADMIN_PASSWORD`
- [ ] Set `ALLOWED_ORIGINS` to your actual frontend domain
- [ ] Set `DASHBOARD_URL` to your actual frontend URL
- [ ] Configure real SMTP credentials (or disable email)
- [ ] Place a TLS-terminating reverse proxy (Nginx + Let's Encrypt) in front
- [ ] Restrict PostgreSQL port (`5432`) from public access
- [ ] Set up automated database backups

### Backup the database
```bash
docker exec postgres pg_dump -U clouduser cloudcost | \
  gzip > cloudcost-backup-$(date +%Y%m%d).sql.gz
```

### Restore
```bash
gunzip < cloudcost-backup-20260513.sql.gz | \
  docker exec -i postgres psql -U clouduser cloudcost
```

---

**Document Version:** 2.0.0  
**Last Updated:** May 2026
