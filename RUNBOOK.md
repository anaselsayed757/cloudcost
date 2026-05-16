# CloudCost — Pre-Presentation Checklist

Run this the night before and again 30 minutes before presenting.
Each step takes about 10 minutes total.

---

## Part 1 — Automated tests (run once)

```bash
cd backend
PATH="$PATH:/home/ubuntu/.local/bin" pytest tests/ -v
```

Expected: **29 passed**. If any fail, do not proceed to the demo — fix first.

---

## Part 2 — Clean start (run the night before)

```bash
# Full clean — removes all data volumes
docker compose down -v

# Rebuild images and start all 7 services
docker compose up -d --build

# Wait ~60 seconds for postgres to initialize, then check
docker compose ps
```

All 7 services should show **Up**:
- node-exporter
- prometheus
- postgres
- backend
- frontend
- mailhog
- grafana

---

## Part 3 — Initialize the system

```bash
# 1. Create admin account
curl -s -X POST http://localhost:8000/auth/setup-admin | python3 -m json.tool
# Expected: { "status": "admin created" }

# 2. Login and save token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -d "username=admin&password=cloudcost2024" | python3 -c \
  "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 3. Seed default tariffs
curl -s -X POST http://localhost:8000/vms/seed \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# Expected: { "status": "seeded" }

# 4. Discover VMs (auto-registers from Prometheus)
curl -s http://localhost:8000/vms/ \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# Expected: array of VM objects (at least 1 — the host running node-exporter)

# 5. Run first billing cycle
curl -s -X POST http://localhost:8000/billing/run \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# Expected: { "billed": N, "records": [...] }
```

---

## Part 4 — UI smoke test (browser)

Open **http://localhost:3000** and verify each item below.

### Login
- [ ] Login page loads (no blank screen)
- [ ] Wrong password shows error message
- [ ] Correct login (`admin` / `cloudcost2024`) redirects to dashboard

### Dashboard
- [ ] KPI cards show VM count, avg CPU %, avg RAM %, alert count
- [ ] Cost chart renders (may show one bar if only one billing cycle run — run billing 2-3 times to see multiple bars)
- [ ] VM table shows at least one VM
- [ ] System info grid shows Prometheus/Database status
- [ ] Dark/light mode toggle works

### Admin actions
- [ ] **Run Billing Now** button works — flash message says "Billed N VMs"
- [ ] **Check Alerts** button works — either "No idle VMs" or shows idle alert count
- [ ] **Seed Tariffs** button works — flash says "Tariffs seeded"
- [ ] **Export CSV** button downloads a CSV file

### Tariff management
- [ ] Tariff panel shows Standard and Premium plans with rates
- [ ] Click "Edit rates" → change a value → Save → rates update

### Budget
- [ ] Budget panel shows a VM dropdown
- [ ] Set a budget limit (e.g. $10) → saved successfully

### Alerts tab
- [ ] Alert History tab loads without error
- [ ] If alerts exist: Acknowledge and Resolve buttons work

### Users tab (admin only)
- [ ] Users tab is visible in nav
- [ ] Existing users listed
- [ ] Add a new viewer user → appears in the list

### VM Labels tab (admin only)
- [ ] VM list shows with instance IDs
- [ ] Edit label → save → label updates

### Viewer role test
- [ ] Log out → log in as viewer (if you created one above)
- [ ] Admin-only tabs (Users, VM Labels) are hidden from nav
- [ ] "Run Billing", "Seed Tariffs", "Check Alerts" buttons are locked (🔒)
- [ ] Tariff panel shows "admin only" message instead of edit form

---

## Part 5 — Forecast (needs 3+ days of billing data)

If presenting live and you have less than 3 days of data, run billing
several times with fake timestamps to build up history — OR demonstrate
the "not enough data" message and explain that the system needs 3 days
minimum, which is a realistic production constraint.

```bash
curl -s "http://localhost:8000/forecast/$(
  curl -s http://localhost:8000/vms/ \
  -H "Authorization: Bearer $TOKEN" | python3 -c \
  "import sys,json; print(json.load(sys.stdin)[0]['instance'])" | \
  python3 -c "import sys,urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))"
)" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## Part 6 — Email test (MailHog)

```bash
curl -s -X POST http://localhost:8000/alerts/test-email \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# Expected: { "sent": true }
```

Open **http://localhost:8025** — the test email should appear in MailHog.

---

## Part 7 — API docs (show the committee)

Open **http://localhost:8000/docs** — Swagger UI should show all endpoints
grouped by tag with accurate auth requirements visible.

---

## Part 8 — Grafana (bonus)

Open **http://localhost:3001** — log in with `admin` / `cloudcost2024`.
If provisioned dashboards appear, great. If not, add Prometheus as a data
source manually (`http://prometheus:9090`) and create a simple panel.

---

## Quick recovery if something breaks during the demo

| Problem | Fix |
|---|---|
| Backend 500 errors | `docker compose restart backend` |
| Frontend blank page | `docker compose restart frontend` |
| Charts empty | Click "Run Billing Now" to generate data, wait 5 seconds, refresh |
| Can't log in | `curl -X POST http://localhost:8000/auth/setup-admin` then try again |
| Port already in use | `docker compose down && docker compose up -d` |

---

## Talking points for the committee

**"Why did you choose FastAPI over Django/Flask?"**
FastAPI is async-native, which matters here because every billing cycle
queries Prometheus for each VM concurrently. Django and Flask are
synchronous by default and would block on each HTTP call.

**"How does the cost calculation work?"**
Each hour the scheduler queries Prometheus for live CPU %, RAM %, and
network bytes for each VM, then applies the formula:
`cost = (metric% / 100) × resource_spec × rate_per_unit_hour`.
This mirrors how real cloud providers (AWS, GCP) calculate per-second billing.

**"Why two forecasting models?"**
Linear Regression is fast and works well when cost trends are stable.
ARIMA captures seasonality and autocorrelation (e.g. high cost on weekday
mornings, low on weekends). The system picks the model with lower RMSE on
historical data automatically — so it adapts to the workload pattern.

**"How is security handled?"**
JWT Bearer tokens with 24-hour expiry, bcrypt password hashing, role-based
access (admin/viewer) enforced server-side on every endpoint, CORS locked
to the configured frontend origin, and rate limiting on the login endpoint
to prevent brute-force attacks.

**"Do you have tests?"**
Yes — 29 unit tests covering the billing formula, forecast metric calculations
(RMSE/MAPE), and authentication (password hashing + JWT). Run with `pytest tests/ -v`.
