# CloudCost - System Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Details](#component-details)
4. [Data Models](#data-models)
5. [Communication Flow](#communication-flow)
6. [Deployment Architecture](#deployment-architecture)

---

## System Overview

CloudCost is a containerized, microservices-based cloud cost management platform. It processes real-time metrics from cloud infrastructure, calculates costs using custom tariffs, predicts future costs, and provides comprehensive management and monitoring capabilities.

### Design Principles
- **Scalability**: Async processing with APScheduler
- **Reliability**: Persistent data storage with PostgreSQL
- **Observability**: Prometheus metrics and Grafana dashboards
- **Security**: JWT-based authentication and role-based access control
- **Maintainability**: Modular architecture with clear separation of concerns

---

## Architecture Diagram

### High-Level System Architecture
```
┌──────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                               │
├──────────────────────────────────────────────────────────────────────┤
│  React 18.2 + Vite                                                   │
│  ├─ Components (KpiCards, Charts, Panels)                           │
│  ├─ Hooks (usePolling, useTheme)                                    │
│  ├─ API Client (Axios/Fetch)                                       │
│  └─ Nginx Reverse Proxy (Port 3000)                                │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTP/REST (JSON)
┌────────────────────────▼─────────────────────────────────────────────┐
│                    Backend Layer - FastAPI                           │
├──────────────────────────────────────────────────────────────────────┤
│ Port 8000 / ASGI (Uvicorn)                                           │
│                                                                      │
│  API Routers:                                                        │
│  ├─ /auth          → Authentication & Authorization                 │
│  ├─ /vms           → VM Management                                  │
│  ├─ /billing       → Cost Calculation & Records                     │
│  ├─ /forecast      → Cost Forecasting                               │
│  ├─ /alerts        → Alert Management                               │
│  └─ /metrics       → System Metrics & KPIs                          │
│                                                                      │
│  Core Services:                                                      │
│  ├─ Database Layer (SQLAlchemy ORM)                                 │
│  ├─ Prometheus Client (Metrics Query)                               │
│  ├─ Scheduler (APScheduler)                                         │
│  ├─ Email Service (SMTP)                                            │
│  └─ Authentication (JWT + Passlib)                                  │
└────────┬──────────────────────────────────────────────┬─────────────┘
         │                                              │
    ┌────▼──────────────┐                    ┌─────────▼────────────┐
    │ Data Persistence  │                    │ Metrics Collection   │
    ├───────────────────┤                    ├──────────────────────┤
    │ PostgreSQL 15     │                    │ Prometheus           │
    │ Port 5432         │                    │ Port 9090            │
    │                   │                    │ TSDB Storage (30d)   │
    │ Tables:           │                    │                      │
    │ ├─ vms            │                    │ Data from:           │
    │ ├─ tariffs        │                    │ ├─ Node Exporter     │
    │ ├─ cost_records   │                    │ ├─ Backend Metrics   │
    │ ├─ budgets        │                    │ └─ Other exporters   │
    │ ├─ alerts         │                    │                      │
    │ ├─ users          │                    └──────────────────────┘
    │ └─ email_logs     │
    └───────────────────┘
         │
    ┌────▼──────────────┐
    │ Visualization     │
    ├───────────────────┤
    │ Grafana           │
    │ Port 3001         │
    │                   │
    │ Pre-built:        │
    │ ├─ Cost Overview  │
    │ ├─ Resource Usage │
    │ ├─ Trend Analysis │
    │ └─ Alerts Status  │
    └───────────────────┘
```

### Container Orchestration
```
docker-compose.yml (7 services)
│
├─ node-exporter    (Port 9100) → Collects system metrics
├─ prometheus       (Port 9090) → Time-series DB for metrics
├─ postgres         (Port 5432) → Application database
├─ backend          (Port 8000) → FastAPI application
├─ frontend         (Port 3000) → React + Nginx
├─ mailhog          (Port 8025) → Email testing
└─ grafana          (Port 3001) → Visualization platform

All connected via custom bridge network: cloudnet
```

---

## Component Details

### Frontend (React + Vite)

**Location**: `/frontend`

**Structure**:
```
frontend/
├─ public/                 # Static assets
├─ src/
│  ├─ api/
│  │  └─ client.js        # Axios HTTP client
│  ├─ components/
│  │  ├─ Login.jsx        # Authentication UI
│  │  ├─ KpiCards.jsx     # Dashboard KPIs
│  │  ├─ CostChart.jsx    # Historical costs chart
│  │  ├─ ForecastChart.jsx # Forecasted costs chart
│  │  ├─ VmTable.jsx      # VM list/management
│  │  ├─ VmDetail.jsx     # VM detail view
│  │  ├─ BudgetPanel.jsx  # Budget management
│  │  ├─ AlertPanel.jsx   # Alert configuration
│  │  ├─ AlertHistory.jsx # Alert history view
│  │  ├─ TariffPanel.jsx  # Tariff management
│  │  ├─ CostRanking.jsx  # Cost ranking visualization
│  │  ├─ UserManagement.jsx # User administration
│  │  ├─ VmLabels.jsx     # VM labeling interface
│  │  └─ StatusBar.jsx    # Application status
│  ├─ hooks/
│  │  ├─ useTheme.js      # Theme management
│  │  └─ usePolling.js    # Data polling hook
│  ├─ App.jsx             # Main component
│  └─ main.jsx            # Entry point
├─ vite.config.js         # Vite configuration
├─ nginx.conf             # Nginx server config
├─ Dockerfile             # Container definition
└─ package.json           # Dependencies
```

**Key Technologies**:
- React 18.2: UI framework
- Vite 5.2: Fast build tool
- Recharts 2.12: Chart visualization
- Axios: HTTP client
- CSS-in-JS: Inline styling

**Responsibilities**:
- User authentication and session management
- Dashboard and KPI visualization
- VM management interface
- Budget and alert configuration
- Cost forecasting and trend analysis
- User preference management

---

### Backend (FastAPI + Python)

**Location**: `/backend`

**Structure**:
```
backend/
├─ app/
│  ├─ api/
│  │  ├─ __init__.py
│  │  ├─ auth.py         # Authentication endpoints
│  │  ├─ vms.py          # VM management endpoints
│  │  ├─ billing.py      # Billing calculation endpoints
│  │  ├─ forecast.py     # Cost forecasting endpoints
│  │  ├─ alerts.py       # Alert management endpoints
│  │  └─ metrics.py      # Metrics aggregation endpoints
│  ├─ __init__.py
│  ├─ main.py            # FastAPI app initialization
│  ├─ models.py          # SQLAlchemy ORM models
│  ├─ database.py        # Database connection & session
│  ├─ auth.py            # Authentication logic
│  ├─ email_service.py   # Email sending service
│  ├─ prometheus_client.py # Prometheus integration
│  ├─ scheduler.py       # APScheduler task scheduling
│  ├─ alerts/ (subpackage)
│  ├─ billing/ (subpackage)
│  └─ forecasting/ (subpackage)
├─ migrations/           # Alembic database migrations
├─ requirements.txt      # Python dependencies
└─ Dockerfile           # Container definition
```

**Key Technologies**:
- FastAPI 0.111.0: Web framework
- SQLAlchemy 2.0.30: ORM
- AsyncPG 0.29.0: PostgreSQL async driver
- APScheduler 3.10.4: Task scheduling
- Pandas/NumPy/Scikit-learn: Data processing
- Python-Jose: JWT handling

**API Endpoints**:
- `POST /auth/login` - User authentication
- `GET /vms/` - List all VMs
- `GET /vms/{instance}/cost` - Get VM cost history
- `POST /billing/run` - Calculate billing for all VMs
- `POST /forecast/generate` - Generate cost forecasts
- `GET /alerts/` - List alerts
- `POST /alerts/` - Create alert
- `GET /metrics/summary` - Get system metrics

**Responsibilities**:
- HTTP API server providing REST endpoints
- Request validation and error handling
- Business logic implementation
- Database queries and management
- Cost calculation algorithms
- Forecasting model execution
- Alert triggering and notification
- Prometheus metrics collection
- Scheduled task execution

---

### Database (PostgreSQL)

**Location**: Container service `postgres`

**Connection Details**:
- Host: postgres
- Port: 5432
- User: clouduser
- Password: cloudpass
- Database: cloudcost

**Schema**:

#### `vms` table
```sql
CREATE TABLE vms (
    instance VARCHAR PRIMARY KEY,
    label VARCHAR,
    tariff_id VARCHAR DEFAULT 'standard',
    cpu_cores FLOAT DEFAULT 2.0,
    ram_gb FLOAT DEFAULT 2.0,
    owner_email VARCHAR DEFAULT 'admin@cloudcost.local',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `tariffs` table
```sql
CREATE TABLE tariffs (
    id VARCHAR PRIMARY KEY,
    name VARCHAR,
    cpu_rate_per_core_hour FLOAT DEFAULT 0.048,
    ram_rate_per_gb_hour FLOAT DEFAULT 0.006,
    network_rate_per_gb FLOAT DEFAULT 0.010,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `cost_records` table
```sql
CREATE TABLE cost_records (
    id VARCHAR PRIMARY KEY,
    vm_instance VARCHAR,
    tariff_id VARCHAR,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    cpu_cost FLOAT,
    ram_cost FLOAT,
    network_cost FLOAT,
    total_cost FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `budgets` table
```sql
CREATE TABLE budgets (
    id VARCHAR PRIMARY KEY,
    vm_instance VARCHAR,
    monthly_limit FLOAT,
    warning_threshold FLOAT DEFAULT 0.80,
    critical_threshold FLOAT DEFAULT 0.95,
    owner_email VARCHAR,
    active BOOLEAN DEFAULT TRUE
);
```

#### `alerts` table
```sql
CREATE TABLE alerts (
    id VARCHAR PRIMARY KEY,
    vm_instance VARCHAR,
    level VARCHAR,
    status VARCHAR,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP
);
```

**Responsibilities**:
- Persistent data storage
- Transaction management
- Data integrity and constraints
- Query optimization
- Backup and recovery

---

### Prometheus

**Location**: Container service `prometheus`

**Port**: 9090

**Configuration**: `/prometheus/prometheus.yml`

**Data Retention**: 30 days

**Metrics Collected From**:
- Node Exporter (system metrics)
- Backend application (custom metrics)

**Key Metrics**:
- `node_cpu_seconds_total` - CPU usage
- `node_memory_MemAvailable_bytes` - Memory available
- `node_network_receive_bytes_total` - Network I/O
- `cloudcost_*` - Application-specific metrics

**Responsibilities**:
- Time-series data collection
- Metric storage
- Query API for data retrieval
- Data aggregation and downsampling

---

### Grafana

**Location**: Container service `grafana`

**Port**: 3001

**Default Credentials**:
- Username: admin
- Password: cloudcost2024

**Pre-configured Dashboards**:
- Cost Overview
- Resource Utilization
- Trend Analysis
- Alert Status

**Data Source**: Prometheus

**Responsibilities**:
- Metric visualization
- Dashboard creation and management
- Alert configuration
- Data exploration

---

## Data Models

### Core Entities

#### VM (Virtual Machine)
```python
class VM:
    instance: str           # Unique identifier (PK)
    label: str              # Human-readable name
    tariff_id: str          # Reference to Tariff
    cpu_cores: float        # Number of CPU cores
    ram_gb: float           # RAM in gigabytes
    owner_email: str        # VM owner's email
    created_at: datetime    # Creation timestamp
```

#### Tariff
```python
class Tariff:
    id: str                      # Unique identifier (PK)
    name: str                    # Tariff name
    cpu_rate_per_core_hour: float
    ram_rate_per_gb_hour: float
    network_rate_per_gb: float
    updated_at: datetime
```

#### CostRecord
```python
class CostRecord:
    id: str                 # Unique identifier (PK)
    vm_instance: str        # Reference to VM
    tariff_id: str          # Reference to Tariff
    period_start: datetime  # Billing period start
    period_end: datetime    # Billing period end
    cpu_cost: float         # CPU cost component
    ram_cost: float         # RAM cost component
    network_cost: float     # Network cost component
    total_cost: float       # Total cost
    created_at: datetime
```

#### Budget
```python
class Budget:
    id: str                 # Unique identifier (PK)
    vm_instance: str        # Reference to VM
    monthly_limit: float    # Monthly budget limit
    warning_threshold: float # Alert at 80% (default)
    critical_threshold: float # Alert at 95% (default)
    owner_email: str        # Budget owner's email
    active: bool            # Is budget active
```

#### Alert
```python
class Alert:
    id: str                 # Unique identifier (PK)
    vm_instance: str        # Reference to VM
    level: str              # "warning" or "critical"
    status: str             # "pending", "acknowledged", "resolved"
    message: str            # Alert message
    created_at: datetime
    acknowledged_at: datetime # When acknowledged
```

### Relationships

```
VM (1) ──→ (Many) CostRecord
VM (1) ──→ (Many) Budget
VM (1) ──→ (Many) Alert
VM (Many) ──→ (1) Tariff
CostRecord (Many) ──→ (1) Tariff
```

---

## Communication Flow

### User Authentication Flow
```
User                Frontend             Backend              Database
  │                   │                    │                     │
  ├─ Login ──────────→│                    │                     │
  │                   ├─ POST /auth/login →│                     │
  │                   │                    ├─ Query user ───────→│
  │                   │                    │←─ User record ──────┤
  │                   │                    ├─ Verify password    │
  │                   │                    ├─ Create JWT ────────┤
  │                   │←─ JWT Token ────────┤                     │
  │←─ Token ──────────┤                    │                     │
  │ (Store in session)│                    │                     │
```

### Cost Calculation Flow
```
1. Scheduler triggers billing task every hour
2. Backend fetches all VMs from database
3. For each VM:
   a. Query Prometheus for CPU, RAM, Network metrics
   b. Fetch VM's tariff rates
   c. Calculate costs:
      - CPU Cost = (CPU % / 100) × CPU Cores × CPU Rate
      - RAM Cost = (RAM % / 100) × RAM GB × RAM Rate
      - Network Cost = (Network GB) × Network Rate
   d. Create CostRecord and save to database
4. Trigger alerts if budget threshold exceeded
5. Send email notifications if configured
```

### Forecasting Flow
```
1. Scheduler triggers forecasting task daily
2. Backend queries historical cost records (last 30 days)
3. For each VM:
   a. Aggregate daily costs
   b. Train forecasting model using sklearn/statsmodels
   c. Generate predictions for next 7/30 days
   d. Store forecasts in cache or database
4. Frontend queries and visualizes forecasts
```

### Alert Flow
```
Budget Threshold Exceeded
        │
        ↓
Backend detects in billing calculation
        │
        ↓
Create Alert record (status: pending)
        │
        ├─→ Send email to VM owner
        │
        ├─→ Create Prometheus alert
        │
        └─→ Notify frontend via API
             │
             ↓
        Display in AlertPanel
             │
             ↓
      User acknowledges
             │
             ↓
     Update Alert (status: acknowledged)
```

---

## Deployment Architecture

### Development Environment
```
Local Machine
└─ docker-compose (all services)
   ├─ Frontend: http://localhost:3000
   ├─ Backend: http://localhost:8000
   ├─ Prometheus: http://localhost:9090
   ├─ Grafana: http://localhost:3001
   └─ Database: localhost:5432
```

### Production Environment (Recommended)
```
Kubernetes Cluster
├─ Frontend Pod (Nginx)
├─ Backend Pod(s) (FastAPI + Auto-scaling)
├─ PostgreSQL StatefulSet (with persistent volume)
├─ Prometheus Deployment
├─ Grafana Deployment
└─ Ingress Controller (for external access)

Or

Docker Swarm / Compose in production
├─ Replicated services
├─ Volume management
├─ Networking (overlay)
└─ Secrets management
```

### Networking Architecture
```
Internet
    │
    ↓
Load Balancer / Ingress
    │
    ├─→ Frontend (Nginx)
    │      │
    │      └─→ React App
    │
    └─→ Backend (FastAPI)
           │
           ├─→ PostgreSQL (Internal)
           ├─→ Prometheus (Internal)
           └─→ Node Exporter (Internal)
```

### Storage Architecture
```
Volumes:
├─ postgres_data         (PostgreSQL data)
├─ prometheus_data       (Prometheus time-series data)
├─ grafana_storage       (Grafana configuration)
└─ frontend_build        (React build artifacts)

All volumes managed by docker-compose
with data persistence across restarts
```

---

## Scalability Considerations

### Horizontal Scaling
- **Backend**: Multiple FastAPI instances behind load balancer
- **Database**: Read replicas for query scaling
- **Prometheus**: Federation for multi-cluster monitoring

### Vertical Scaling
- **Database**: Increase CPU/RAM for PostgreSQL
- **Backend**: More workers for Uvicorn/Gunicorn
- **Prometheus**: Larger retention and ingestion rates

### Performance Optimization
- **Caching**: Redis cache for frequent queries
- **Indexing**: Database indexes on frequent query columns
- **Async**: All I/O operations are async
- **Batch Processing**: Batch cost calculations
- **Metrics Retention**: Configurable Prometheus retention

---

## High Availability & Disaster Recovery

### Backup Strategy
```bash
# Database backup
docker exec postgres pg_dump -U clouduser cloudcost > backup.sql

# Volume backup
docker run -v postgres_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres_backup.tar.gz /data
```

### Recovery Procedure
```bash
# Restore database
docker exec -i postgres psql -U clouduser cloudcost < backup.sql

# Restore volume
docker run -v postgres_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/postgres_backup.tar.gz -C /
```

### Monitoring & Alerts
- Health check endpoints on all services
- Prometheus alerting rules for critical metrics
- Grafana alerting for dashboard conditions
- Log aggregation and analysis

---

## Security Architecture

### Authentication & Authorization
- JWT tokens for API authentication
- Bearer token in HTTP headers
- Token expiration and refresh mechanism
- Role-based access control (Admin/User)

### Data Protection
- TLS/SSL for encrypted communication (production)
- Bcrypt hashing for passwords
- Environment variables for secrets
- Database access control

### Network Security
- Internal docker network (cloudnet) for service communication
- Firewall rules for external ports
- API rate limiting (recommended)
- CORS configuration

---

## Monitoring & Observability

### Logging
```
Services → Docker Logs → ELK/Splunk (optional)
                      → Local log files
```

### Metrics
```
Exporters → Prometheus → Grafana → Dashboards
                      → Alertmanager
```

### Tracing
- Application-level logging in FastAPI
- Request ID correlation (recommended)
- Performance metrics collection

---

**Document Version**: 1.0.0  
**Last Updated**: May 2, 2026
