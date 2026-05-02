# CloudCost - Setup & Installation Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Initial Setup](#initial-setup)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)
8. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### System Requirements
- **OS**: Linux, macOS, or Windows with WSL2
- **CPU**: 2 cores minimum (4 cores recommended)
- **RAM**: 4GB minimum (8GB recommended)
- **Disk**: 20GB free space (30GB for production)
- **Network**: Internet access for downloading Docker images

### Software Requirements

#### Required
- **Docker**: Version 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 1.29+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Git**: For cloning and version control ([Install Git](https://git-scm.com/))

#### Optional (for development)
- **Python**: 3.9+ (if developing backend locally)
- **Node.js**: 16+ (if developing frontend locally)
- **PostgreSQL Client**: For database management
- **curl** or **Postman**: For API testing

### Check Installed Versions
```bash
# Check Docker
docker --version
# Expected: Docker version 20.10+

# Check Docker Compose
docker-compose --version
# Expected: Docker Compose version 1.29+

# Check Git
git --version
# Expected: git version 2.x+
```

---

## Installation

### Step 1: Clone Repository

```bash
# Clone the CloudCost repository
git clone https://github.com/your-org/cloudcost.git
cd cloudcost

# Verify directory structure
ls -la
```

Expected structure:
```
cloudcost/
├── backend/
├── frontend/
├── grafana/
├── prometheus/
├── docker-compose.yml
├── README.md
└── ...
```

### Step 2: Prepare Environment Variables

Create `.env` file in the project root:

```bash
# Create .env file
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=clouduser
POSTGRES_PASSWORD=cloudpass
POSTGRES_DB=cloudcost

# Backend Configuration
DATABASE_URL=postgresql://clouduser:cloudpass@postgres:5432/cloudcost
PROMETHEUS_URL=http://prometheus:9090

# SMTP Configuration (MailHog for development)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASSWORD=test

# Grafana Configuration
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=cloudcost2024

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
EOF

# Verify .env file
cat .env
```

### Step 3: Build Docker Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

Monitor the build process. This may take 5-10 minutes depending on your internet speed.

### Step 4: Start Services

```bash
# Start all services in the background
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# NAME                COMMAND                  STATUS              PORTS
# node-exporter       "/node_exporter ..."     Up 2 minutes        9100/tcp
# prometheus          "/bin/prometheus ..."    Up 2 minutes        9090/tcp
# postgres            "docker-entrypoint..."   Up 2 minutes        5432/tcp
# backend             "uvicorn app.main..."    Up 2 minutes        8000/tcp
# frontend            "nginx -g daemon off"    Up 2 minutes        3000/tcp
# mailhog             "MailHog"                Up 2 minutes        1025/tcp, 8025/tcp
# grafana             "/run.sh"                Up 2 minutes        3000/tcp→3001/tcp
```

### Step 5: Initialize Database

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Expected output:
# INFO [alembic.runtime.migration] Context impl PostgresqlImpl()
# INFO [alembic.runtime.migration] Will assume transactional DDL.
# INFO [alembic.runtime.migration] Running upgrade 0 -> 1, Initial migration
```

---

## Configuration

### Environment Variables

Key environment variables and their purposes:

#### Database
```bash
POSTGRES_USER=clouduser              # PostgreSQL user
POSTGRES_PASSWORD=cloudpass          # PostgreSQL password (change in production!)
POSTGRES_DB=cloudcost                # Database name
DATABASE_URL=postgresql://...        # Full connection string
```

#### Backend
```bash
PROMETHEUS_URL=http://prometheus:9090    # Prometheus API endpoint
SECRET_KEY=your-secret-key               # JWT signing key (CHANGE in production!)
JWT_ALGORITHM=HS256                      # JWT algorithm
JWT_EXPIRATION_HOURS=24                  # Token expiration
```

#### Email
```bash
SMTP_HOST=mailhog           # SMTP server (MailHog for dev)
SMTP_PORT=1025              # SMTP port
SMTP_USER=test              # SMTP username
SMTP_PASSWORD=test          # SMTP password
```

#### Frontend
```bash
REACT_APP_API_URL=http://localhost:8000    # Backend API URL
```

#### Grafana
```bash
GF_SECURITY_ADMIN_USER=admin              # Grafana admin user
GF_SECURITY_ADMIN_PASSWORD=cloudcost2024  # Grafana admin password (change in production!)
```

### Configuration Files

#### docker-compose.yml
Main orchestration file. Modify service configurations:
- Port mappings
- Environment variables
- Volume mounts
- Resource limits

#### prometheus/prometheus.yml
Prometheus scrape configuration:
```yaml
global:
  scrape_interval: 15s           # Scrape every 15 seconds
  evaluation_interval: 15s       # Evaluate rules every 15 seconds

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

#### grafana/provisioning/
Grafana dashboard and datasource definitions:
- `datasources/prometheus.yml`: Prometheus data source config
- `dashboards/dashboard.yml`: Dashboard definitions

#### nginx.conf (Frontend)
Nginx server configuration:
- Port 3000 binding
- React app serving
- API proxy configuration (optional)

---

## Initial Setup

### Step 1: Access Application

After services are running, access:

**Frontend**: http://localhost:3000
**Backend API**: http://localhost:8000
**API Docs**: http://localhost:8000/docs
**Prometheus**: http://localhost:9090
**Grafana**: http://localhost:3001 (admin / cloudcost2024)
**MailHog**: http://localhost:8025

### Step 2: First Login

1. Open http://localhost:3000 in browser
2. Log in with:
   - **Email**: admin@cloudcost.local
   - **Password**: (check backend logs or docker compose output)

```bash
# Check backend logs for initial credentials
docker-compose logs backend | grep -i password
```

### Step 3: Create Default Tariffs

```bash
# Access backend API documentation
# Go to http://localhost:8000/docs

# Use Swagger UI to create tariffs:
# POST /billing/tariffs with:
{
  "id": "standard",
  "name": "Standard Plan",
  "cpu_rate_per_core_hour": 0.048,
  "ram_rate_per_gb_hour": 0.006,
  "network_rate_per_gb": 0.010
}
```

Or using curl:

```bash
TOKEN="<your-jwt-token>"

curl -X POST http://localhost:8000/billing/tariffs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "standard",
    "name": "Standard Plan",
    "cpu_rate_per_core_hour": 0.048,
    "ram_rate_per_gb_hour": 0.006,
    "network_rate_per_gb": 0.010
  }'
```

### Step 4: Add Virtual Machines

1. Log in to Frontend
2. Navigate to VM Management
3. Add VMs with:
   - Instance ID (e.g., vm-001)
   - Label (human-readable name)
   - CPU Cores
   - RAM (GB)
   - Owner Email
   - Tariff

### Step 5: Configure Budgets & Alerts

1. Select VM from list
2. Click "Set Budget"
3. Enter monthly limit
4. Set warning threshold (default: 80%)
5. Set critical threshold (default: 95%)
6. Enter owner email for notifications

### Step 6: Trigger First Billing

```bash
TOKEN="<your-jwt-token>"

curl -X POST http://localhost:8000/billing/run \
  -H "Authorization: Bearer $TOKEN"
```

### Step 7: View Dashboards

Access Grafana (http://localhost:3001):
1. Log in: admin / cloudcost2024
2. Select pre-configured dashboard
3. View cost metrics and trends

---

## Verification

### Verify All Services Running

```bash
# Check service status
docker-compose ps

# Check service logs
docker-compose logs -f

# Tail specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Health Checks

```bash
# API Health
curl http://localhost:8000/health
# Expected: {"status": "ok"}

# Database Connection
docker-compose exec postgres psql -U clouduser -d cloudcost -c "SELECT 1"
# Expected: Output without errors

# Prometheus API
curl http://localhost:9090/api/v1/query?query=up
# Expected: JSON response with metrics

# Frontend
curl -s http://localhost:3000 | head -20
# Expected: HTML content
```

### Test API Endpoints

```bash
# 1. Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cloudcost.local","password":"password"}'

# 2. Get VMs
curl http://localhost:8000/vms/ \
  -H "Authorization: Bearer <token>"

# 3. Get Metrics
curl http://localhost:8000/metrics/summary \
  -H "Authorization: Bearer <token>"
```

### Check Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U clouduser -d cloudcost

# List tables
\dt

# Check VMs table
SELECT * FROM vms;

# Exit
\q
```

### View Application Logs

```bash
# All services
docker-compose logs -f

# Backend only (last 100 lines)
docker-compose logs -f backend --tail=100

# Frontend only
docker-compose logs -f frontend

# In real-time
docker-compose logs -f --follow
```

---

## Troubleshooting

### Issue: Services won't start

**Problem**: `docker-compose up` fails

**Solutions**:
```bash
# Check Docker is running
docker ps

# Check .env file exists and is valid
cat .env

# Try building again
docker-compose build --no-cache

# Check available disk space
df -h

# Check port conflicts
netstat -an | grep -E '3000|8000|5432|9090|3001'
```

### Issue: Database connection fails

**Problem**: Backend can't connect to PostgreSQL

**Solutions**:
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database exists
docker-compose exec postgres psql -U clouduser -l | grep cloudcost

# Check connection string in .env
cat .env | grep DATABASE_URL

# Recreate database
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds
docker-compose exec postgres psql -U clouduser -c "CREATE DATABASE cloudcost"
```

### Issue: Frontend blank or not loading

**Problem**: Blank page or loading error

**Solutions**:
```bash
# Check frontend is serving
curl http://localhost:3000

# Check backend API URL is correct
docker-compose logs frontend | grep -i api

# Verify backend is running
curl http://localhost:8000/health

# Check browser console for errors (F12 in browser)

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose restart frontend
```

### Issue: Metrics not showing

**Problem**: No data in Prometheus or Grafana

**Solutions**:
```bash
# Check Node Exporter is running
curl http://localhost:9100/metrics

# Check Prometheus is scraping
# Open http://localhost:9090/targets

# Check Prometheus config
cat prometheus/prometheus.yml

# Wait for data collection (at least 1 minute)

# Verify backend is sending metrics
docker-compose logs backend | grep metric
```

### Issue: Authentication failing

**Problem**: Login fails or token invalid

**Solutions**:
```bash
# Check backend logs
docker-compose logs backend | grep -i auth

# Reset database
docker-compose exec postgres psql -U clouduser -d cloudcost \
  -c "DELETE FROM users"

# Check JWT_SECRET_KEY is set
cat .env | grep SECRET_KEY

# Verify password hashing
docker-compose logs backend | grep -i password
```

### Clear Everything & Start Fresh

```bash
# Stop all services
docker-compose down

# Remove all data (WARNING: destructive!)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Clean up
docker system prune -a

# Start fresh
docker-compose build
docker-compose up -d
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong SECRET_KEY
- [ ] Configure HTTPS/TLS
- [ ] Set up external database backup
- [ ] Configure persistent volumes
- [ ] Set resource limits
- [ ] Enable logging aggregation
- [ ] Set up monitoring and alerting
- [ ] Configure firewall rules
- [ ] Test disaster recovery procedures

### Security Configuration

#### Environment Variables (Production)
```bash
# Generate strong secret key
SECRET_KEY=$(openssl rand -hex 32)
echo "SECRET_KEY=$SECRET_KEY" >> .env

# Set strong database password
POSTGRES_PASSWORD=$(openssl rand -base64 32)
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env

# Update all services to use strong passwords
# ... update docker-compose.yml accordingly
```

#### TLS/SSL Setup

```yaml
# Update docker-compose.yml for production
services:
  frontend:
    environment:
      - HTTPS=true
      - SSL_CERT_FILE=/etc/ssl/certs/cert.pem
      - SSL_KEY_FILE=/etc/ssl/private/key.pem
    volumes:
      - /path/to/cert.pem:/etc/ssl/certs/cert.pem
      - /path/to/key.pem:/etc/ssl/private/key.pem
```

#### Database Backup

```bash
# Automated daily backup
crontab -e

# Add: backup database daily at 2 AM
0 2 * * * docker exec postgres pg_dump -U clouduser cloudcost \
  | gzip > /backups/cloudcost-$(date +\%Y\%m\%d).sql.gz
```

### Kubernetes Deployment (Optional)

For Kubernetes deployment, convert docker-compose to Kubernetes manifests:

```bash
# Using Kompose tool
kompose convert -f docker-compose.yml -o k8s/

# This generates:
# - Deployments for each service
# - Services for networking
# - PersistentVolumeClaims for data
```

### Multi-Machine Deployment

For distributed setup:

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 3
      placement:
        constraints: [node.role == worker]
    environment:
      - REDIS_URL=redis://redis-master:6379

  postgres:
    deploy:
      placement:
        constraints: [node.labels.database == true]

networks:
  cloudnet:
    driver: overlay
```

---

## Backup & Recovery

### Backup Procedures

#### Full Backup
```bash
#!/bin/bash
BACKUP_DIR=/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database backup
docker exec postgres pg_dump -U clouduser cloudcost | \
  gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Volume backups
docker run --rm \
  -v postgres_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/postgres_data_$TIMESTAMP.tar.gz /data

# Application configuration
tar czf $BACKUP_DIR/config_$TIMESTAMP.tar.gz \
  .env prometheus/ grafana/ nginx.conf

echo "Backup completed: $BACKUP_DIR"
```

#### Scheduled Backups
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh

# Log rotations
find /backups -name "*.gz" -mtime +30 -delete
```

### Recovery Procedures

#### Restore Database
```bash
# Stop services
docker-compose stop

# Restore from backup
gunzip < backup.sql.gz | \
  docker exec -i postgres psql -U clouduser cloudcost

# Restart services
docker-compose start
```

#### Restore Volumes
```bash
# Stop services
docker-compose down

# Restore volume
docker run --rm \
  -v postgres_data:/data \
  -v /path/to/backup:/backup \
  alpine tar xzf /backup/postgres_data.tar.gz

# Restart
docker-compose up -d
```

#### Point-in-Time Recovery
```bash
# PostgreSQL WAL-based recovery
# 1. Ensure WAL archiving is configured
# 2. Restore from backup
# 3. Replay WAL files to specific timestamp

# Example
docker exec postgres psql -U clouduser -c \
  "CREATE DATABASE cloudcost_recovery"
# Then use pg_basebackup and wal-e
```

---

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor service logs
- Check disk space
- Monitor alerts

#### Weekly
- Database maintenance (VACUUM)
- Log rotation
- Backup verification

#### Monthly
- Performance review
- Security updates
- Disaster recovery drill

#### Quarterly
- Dependency updates
- Database optimization
- Capacity planning

### Common Maintenance Commands

```bash
# Database maintenance
docker-compose exec postgres psql -U clouduser -d cloudcost \
  -c "VACUUM ANALYZE"

# Clean old logs
docker-compose exec backend rm -f /var/log/cloudcost/*.log.1

# Restart service
docker-compose restart backend

# Update images
docker-compose pull
docker-compose up -d

# Monitor performance
docker stats
```

---

## Support & Help

- **Documentation**: https://docs.cloudcost.example.com
- **Issues**: https://github.com/your-org/cloudcost/issues
- **Community**: Slack/Discord channel
- **Email**: support@cloudcost.example.com

---

**Document Version**: 1.0.0  
**Last Updated**: May 2, 2026
