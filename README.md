# CloudCost - Cloud Infrastructure Cost Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.9+-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Overview

CloudCost is a comprehensive cloud infrastructure cost management and monitoring system. It provides real-time cost tracking, forecasting, budget management, and alerting for virtual machines (VMs) in your cloud environment.

**Key Features:**
- 🔍 **Real-time Cost Tracking**: Monitor VM costs as they occur
- 📊 **Cost Forecasting**: Predict future costs based on historical data
- 💰 **Budget Management**: Set and monitor budget limits per VM
- 🚨 **Intelligent Alerts**: Get notified when costs exceed thresholds
- 📈 **Cost Analytics**: Visualize costs with detailed charts and reports
- 👥 **User Management**: Role-based access control (Admin/User)
- 🏷️ **Custom Tariffs**: Define custom pricing models
- 📋 **Billing Records**: Comprehensive billing history and records

---

## 🏗️ System Architecture

The system is built using a microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                   │
│                    Port 3000 / Nginx                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│               Backend (FastAPI + Python)                    │
│                    Port 8000                                 │
├─────────────────────────────────────────────────────────────┤
│ • Authentication & Authorization                            │
│ • API Endpoints (VMs, Billing, Forecast, Alerts, etc.)     │
│ • Scheduler for periodic billing & forecasting             │
│ • Prometheus integration for metrics                        │
└────────────────┬──────────────────┬────────────────────────┘
                 │                  │
    ┌────────────▼───────┐   ┌──────▼──────────────┐
    │  PostgreSQL DB     │   │  Prometheus        │
    │  (Metrics & Data)  │   │  (Port 9090)       │
    └────────────────────┘   └────────────────────┘
                 │
    ┌────────────▼────────────────┐
    │  Grafana Dashboard          │
    │  (Port 3001)                │
    │  Visualization & Monitoring │
    └─────────────────────────────┘
```

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Linux/MacOS or WSL2 (for Windows)
- 4GB+ RAM
- 20GB+ disk space

### Installation & Running

1. **Clone the repository:**
   ```bash
   cd /home/ubuntu/cloudcost
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs
   - **Prometheus**: http://localhost:9090
   - **Grafana**: http://localhost:3001
   - **Email Inbox**: http://localhost:8025 (MailHog)

4. **Default Credentials:**
   - **Grafana**: admin / cloudcost2024
   - **Frontend**: admin@cloudcost.local / (set during first login)

### First Steps
1. Log in to the application
2. Manage users (if admin)
3. Define VM labels and tariffs
4. Set budgets and alerts
5. Monitor dashboards

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture, data models, and component overview |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete REST API endpoint reference |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Detailed installation and configuration guide |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | Development setup, coding standards, and contribution guidelines |
| [COMPONENTS.md](./COMPONENTS.md) | Frontend component documentation |

---

## 🔧 Technology Stack

### Backend
- **Framework**: FastAPI 0.111.0
- **Database**: PostgreSQL 15 with SQLAlchemy ORM
- **Task Scheduling**: APScheduler
- **Metrics**: Prometheus Python Client
- **Authentication**: Python-Jose with JWT
- **Data Processing**: Pandas, NumPy, Scikit-learn
- **Email**: SMTP integration

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite 5.2
- **Charts**: Recharts 2.12
- **Server**: Nginx
- **Package Manager**: npm

### Infrastructure
- **Container Orchestration**: Docker & Docker Compose
- **Monitoring**: Prometheus, Grafana
- **Database**: PostgreSQL 15
- **Metrics Collection**: Node Exporter
- **Email Testing**: MailHog

---

## 📊 Key Components

### Backend API Routes
- **Authentication** (`/auth`): Login, logout, token refresh
- **Virtual Machines** (`/vms`): VM management and metrics
- **Billing** (`/billing`): Cost calculation and records
- **Forecasting** (`/forecast`): Cost predictions and trends
- **Alerts** (`/alerts`): Alert configuration and history
- **Metrics** (`/metrics`): System metrics and KPIs

### Frontend Components
- **KpiCards**: Key Performance Indicators display
- **CostChart**: Historical cost visualization
- **ForecastChart**: Cost forecasting visualization
- **VmTable**: VM list with sorting and filtering
- **BudgetPanel**: Budget configuration and monitoring
- **AlertPanel**: Alert creation and configuration
- **UserManagement**: Admin user management interface
- **TariffPanel**: Custom tariff definition

---

## 💡 Core Concepts

### Virtual Machine (VM)
- **Instance ID**: Unique identifier for a VM
- **Label**: Human-readable name for the VM
- **Tariff**: Pricing model applied to the VM
- **CPU Cores**: Number of CPU cores allocated
- **RAM GB**: Amount of RAM in gigabytes

### Tariff
Defines hourly rates for resource usage:
- **CPU Rate**: Cost per core per hour (default: $0.048)
- **RAM Rate**: Cost per GB per hour (default: $0.006)
- **Network Rate**: Cost per GB transferred (default: $0.010)

### Cost Record
Captures billing data for a VM during a period:
- **Period**: Time window for the billing period (hourly)
- **CPU Cost**: Cost of CPU usage
- **RAM Cost**: Cost of RAM usage
- **Network Cost**: Cost of network traffic
- **Total Cost**: Sum of all costs

### Budget
Sets spending limits for VMs:
- **Monthly Limit**: Maximum budget per month
- **Warning Threshold**: Alert when reaching 80% (default)
- **Critical Threshold**: Alert when reaching 95% (default)

### Alert
Triggered when budget thresholds are exceeded:
- **Status**: Pending, Acknowledged, Resolved
- **Level**: Warning, Critical
- **Email Notification**: Sent to VM owner

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Middleware**: Controlled cross-origin requests
- **Role-Based Access**: Admin and User roles
- **Environment Variables**: Sensitive data in .env files
- **HTTPS Ready**: Nginx reverse proxy with SSL support

---

## 📈 Monitoring & Observability

- **Prometheus Integration**: Scrapes metrics from Node Exporter
- **Grafana Dashboards**: Pre-configured dashboards for visualization
- **Health Checks**: `/health` endpoint for system status
- **Structured Logging**: Application and container logs
- **Metrics Export**: Prometheus metrics endpoint

---

## 🛠️ Common Tasks

### View Logs
```bash
# View all services
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Operations
```bash
# Access PostgreSQL
docker exec -it postgres psql -U clouduser -d cloudcost

# Run migrations
docker exec backend alembic upgrade head
```

### Restart Services
```bash
# Restart backend
docker-compose restart backend

# Restart all
docker-compose restart
```

### Stop Services
```bash
# Stop without removing
docker-compose stop

# Stop and remove
docker-compose down
```

---

## 📞 Support & Contributing

For issues, questions, or contributions:
1. Check the [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for contribution guidelines
2. Review existing documentation
3. Contact the development team

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 📝 Version History

### v1.0.0 (Current)
- Initial release
- Core features: Cost tracking, forecasting, budgeting, alerts
- Multi-user support with role-based access
- Grafana dashboard integration
- Email notifications

---

## 🎯 Roadmap

- [ ] API versioning and backward compatibility
- [ ] Advanced cost optimization recommendations
- [ ] Multi-cloud provider support (AWS, Azure, GCP)
- [ ] Cost anomaly detection using ML
- [ ] Custom report generation
- [ ] Integration with cloud provider APIs
- [ ] Mobile application
- [ ] Advanced RBAC with team management

---

**Last Updated**: May 2, 2026  
**Maintainers**: Development Team
