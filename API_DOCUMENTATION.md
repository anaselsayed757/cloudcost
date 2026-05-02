# CloudCost - REST API Documentation

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Status Codes](#status-codes)
5. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Virtual Machines](#virtual-machines-endpoints)
   - [Billing](#billing-endpoints)
   - [Forecasting](#forecasting-endpoints)
   - [Alerts](#alerts-endpoints)
   - [Metrics](#metrics-endpoints)
6. [Data Models](#data-models)
7. [Examples](#examples)

---

## API Overview

CloudCost provides a RESTful API for managing cloud infrastructure costs, budgets, forecasts, and alerts. The API is built with FastAPI and provides automatic OpenAPI (Swagger) documentation.

### Key Features
- **Asynchronous Processing**: All I/O operations are non-blocking
- **Pagination Support**: List endpoints support limit and offset
- **Filtering**: Most endpoints support query parameter filtering
- **Real-time Data**: Live metrics from Prometheus
- **JWT Authentication**: Secure token-based access
- **Comprehensive Errors**: Detailed error messages and status codes

### Access Points
- **Base URL**: `http://localhost:8000` (development)
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **ReDoc**: `http://localhost:8000/redoc` (ReDoc UI)
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

---

## Authentication

### Overview
CloudCost uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the `Authorization` header.

### Token Format
```
Authorization: Bearer <token>
```

### Token Structure
JWT tokens contain:
- **Header**: Algorithm and token type
- **Payload**: User ID, role, expiration time
- **Signature**: Cryptographic signature for verification

### Token Lifecycle
1. User logs in with credentials → Receives JWT token
2. Token is valid for 24 hours (configurable)
3. Token can be refreshed before expiration
4. Token is included in all subsequent requests
5. Token expires after 24 hours → User must re-login

### Authentication Error Responses
```json
{
  "detail": "Not authenticated"
}
```
Status: `401 Unauthorized`

---

## Base URL

All API endpoints are relative to the base URL:

**Development**:
```
http://localhost:8000
```

**Production**:
```
https://api.cloudcost.example.com
```

---

## Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request succeeded, no content returned |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User lacks permissions |
| 404 | Not Found | Resource not found |
| 422 | Validation Error | Request body validation failed |
| 500 | Internal Server Error | Server error |

---

## Endpoints

### Health Check

#### Get System Health
```
GET /health
```

**Description**: Check if the API is running and healthy.

**Authentication**: Not required

**Response** (200):
```json
{
  "status": "ok"
}
```

**Example**:
```bash
curl http://localhost:8000/health
```

---

## Authentication Endpoints

### Login

#### User Login
```
POST /auth/login
```

**Description**: Authenticate user and receive JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "email": "user@example.com",
    "role": "user",
    "id": "user-uuid"
  }
}
```

**Error** (401):
```json
{
  "detail": "Invalid credentials"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cloudcost.local",
    "password": "password"
  }'
```

---

### Logout

#### User Logout
```
POST /auth/logout
```

**Description**: Invalidate user session and token.

**Authentication**: Required

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

### Refresh Token

#### Refresh Access Token
```
POST /auth/refresh
```

**Description**: Get a new JWT token using current token.

**Authentication**: Required

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Authorization: Bearer <token>"
```

---

## Virtual Machines Endpoints

### List VMs

#### Get All Virtual Machines
```
GET /vms/
```

**Description**: Retrieve list of all VMs with their configurations.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | integer | Number of records to skip (default: 0) |
| limit | integer | Number of records to return (default: 100) |
| tariff_id | string | Filter by tariff |

**Response** (200):
```json
[
  {
    "instance": "vm-001",
    "label": "Production Server",
    "tariff_id": "standard",
    "cpu_cores": 4.0,
    "ram_gb": 8.0,
    "owner_email": "admin@cloudcost.local",
    "created_at": "2026-01-15T10:30:00Z"
  },
  {
    "instance": "vm-002",
    "label": "Development Server",
    "tariff_id": "standard",
    "cpu_cores": 2.0,
    "ram_gb": 4.0,
    "owner_email": "dev@cloudcost.local",
    "created_at": "2026-01-16T14:20:00Z"
  }
]
```

**Example**:
```bash
curl http://localhost:8000/vms/ \
  -H "Authorization: Bearer <token>"

# With filters
curl "http://localhost:8000/vms/?tariff_id=standard&limit=50" \
  -H "Authorization: Bearer <token>"
```

---

### Get VM Details

#### Get Single VM Details
```
GET /vms/{instance}
```

**Description**: Retrieve detailed information about a specific VM.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| instance | string | VM instance ID |

**Response** (200):
```json
{
  "instance": "vm-001",
  "label": "Production Server",
  "tariff_id": "standard",
  "cpu_cores": 4.0,
  "ram_gb": 8.0,
  "owner_email": "admin@cloudcost.local",
  "created_at": "2026-01-15T10:30:00Z"
}
```

**Error** (404):
```json
{
  "detail": "VM not found"
}
```

**Example**:
```bash
curl http://localhost:8000/vms/vm-001 \
  -H "Authorization: Bearer <token>"
```

---

### Update VM

#### Update Virtual Machine
```
PUT /vms/{instance}
```

**Description**: Update VM configuration (label, owner, tariff).

**Authentication**: Required (Admin only)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| instance | string | VM instance ID |

**Request Body**:
```json
{
  "label": "Updated Production Server",
  "tariff_id": "premium",
  "owner_email": "newowner@cloudcost.local"
}
```

**Response** (200):
```json
{
  "instance": "vm-001",
  "label": "Updated Production Server",
  "tariff_id": "premium",
  "cpu_cores": 4.0,
  "ram_gb": 8.0,
  "owner_email": "newowner@cloudcost.local",
  "created_at": "2026-01-15T10:30:00Z"
}
```

**Example**:
```bash
curl -X PUT http://localhost:8000/vms/vm-001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Updated Production Server",
    "tariff_id": "premium"
  }'
```

---

### Get VM Cost History

#### Get VM Cost Records
```
GET /vms/{instance}/cost
```

**Description**: Retrieve cost history for a specific VM.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| instance | string | VM instance ID |

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| days | integer | Number of days to retrieve (default: 7) |
| from_date | string | Start date (YYYY-MM-DD) |
| to_date | string | End date (YYYY-MM-DD) |

**Response** (200):
```json
{
  "vm_instance": "vm-001",
  "days": 7,
  "total": 156.48,
  "records": [
    {
      "date": "2026-04-25",
      "cpu_cost": 18.24,
      "ram_cost": 7.68,
      "network_cost": 2.40,
      "total_cost": 28.32
    },
    {
      "date": "2026-04-26",
      "cpu_cost": 19.56,
      "ram_cost": 8.10,
      "network_cost": 2.88,
      "total_cost": 30.54
    }
  ]
}
```

**Example**:
```bash
curl "http://localhost:8000/vms/vm-001/cost?days=30" \
  -H "Authorization: Bearer <token>"
```

---

## Billing Endpoints

### Get Tariffs

#### List All Tariffs
```
GET /billing/tariffs
```

**Description**: Retrieve all available tariff plans.

**Authentication**: Required

**Response** (200):
```json
[
  {
    "id": "standard",
    "name": "Standard Plan",
    "cpu_rate_per_core_hour": 0.048,
    "ram_rate_per_gb_hour": 0.006,
    "network_rate_per_gb": 0.010,
    "updated_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": "premium",
    "name": "Premium Plan",
    "cpu_rate_per_core_hour": 0.060,
    "ram_rate_per_gb_hour": 0.010,
    "network_rate_per_gb": 0.015,
    "updated_at": "2026-01-01T00:00:00Z"
  }
]
```

**Example**:
```bash
curl http://localhost:8000/billing/tariffs \
  -H "Authorization: Bearer <token>"
```

---

### Create/Update Tariff

#### Create New Tariff
```
POST /billing/tariffs
```

**Description**: Create a new custom tariff plan.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "id": "custom",
  "name": "Custom Plan",
  "cpu_rate_per_core_hour": 0.055,
  "ram_rate_per_gb_hour": 0.008,
  "network_rate_per_gb": 0.012
}
```

**Response** (201):
```json
{
  "id": "custom",
  "name": "Custom Plan",
  "cpu_rate_per_core_hour": 0.055,
  "ram_rate_per_gb_hour": 0.008,
  "network_rate_per_gb": 0.012,
  "updated_at": "2026-05-02T10:30:00Z"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/billing/tariffs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom",
    "name": "Custom Plan",
    "cpu_rate_per_core_hour": 0.055,
    "ram_rate_per_gb_hour": 0.008,
    "network_rate_per_gb": 0.012
  }'
```

---

### Run Billing

#### Calculate Billing for All VMs
```
POST /billing/run
```

**Description**: Calculate and record costs for all VMs for the current hour.

**Authentication**: Required (Admin only)

**Response** (200):
```json
{
  "billed": 3,
  "records": [
    {
      "vm": "vm-001",
      "total_cost": 28.32,
      "cpu_cost": 18.24,
      "ram_cost": 7.68,
      "net_cost": 2.40
    },
    {
      "vm": "vm-002",
      "total_cost": 15.60,
      "cpu_cost": 9.36,
      "ram_cost": 4.32,
      "net_cost": 1.92
    }
  ]
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/billing/run \
  -H "Authorization: Bearer <token>"
```

---

### Get Billing Records

#### List Billing Records
```
GET /billing/records
```

**Description**: Retrieve all billing records with filtering options.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| vm_instance | string | Filter by VM instance |
| start_date | string | Start date (YYYY-MM-DD) |
| end_date | string | End date (YYYY-MM-DD) |
| limit | integer | Number of records (default: 100) |

**Response** (200):
```json
[
  {
    "id": "record-uuid",
    "vm_instance": "vm-001",
    "tariff_id": "standard",
    "period_start": "2026-04-26T00:00:00Z",
    "period_end": "2026-04-26T01:00:00Z",
    "cpu_cost": 18.24,
    "ram_cost": 7.68,
    "network_cost": 2.40,
    "total_cost": 28.32,
    "created_at": "2026-04-26T01:05:00Z"
  }
]
```

**Example**:
```bash
curl "http://localhost:8000/billing/records?vm_instance=vm-001" \
  -H "Authorization: Bearer <token>"
```

---

## Forecasting Endpoints

### Generate Forecast

#### Generate Cost Forecast
```
POST /forecast/generate
```

**Description**: Generate cost predictions for all VMs using historical data.

**Authentication**: Required (Admin only)

**Request Body**:
```json
{
  "days_ahead": 7,
  "historical_days": 30
}
```

**Response** (200):
```json
{
  "generated_at": "2026-05-02T10:30:00Z",
  "forecast_range": 7,
  "forecasts": [
    {
      "vm_instance": "vm-001",
      "predictions": [
        {
          "date": "2026-05-03",
          "predicted_cost": 28.50,
          "confidence_lower": 27.20,
          "confidence_upper": 29.80
        },
        {
          "date": "2026-05-04",
          "predicted_cost": 28.75,
          "confidence_lower": 27.30,
          "confidence_upper": 30.20
        }
      ]
    }
  ]
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/forecast/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "days_ahead": 7,
    "historical_days": 30
  }'
```

---

### Get Forecast

#### Get Latest Forecast
```
GET /forecast/latest
```

**Description**: Retrieve latest generated forecast for all VMs.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| vm_instance | string | Filter by VM instance |

**Response** (200):
```json
{
  "generated_at": "2026-05-02T10:30:00Z",
  "forecasts": [
    {
      "vm_instance": "vm-001",
      "predictions": [
        {
          "date": "2026-05-03",
          "predicted_cost": 28.50
        }
      ]
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:8000/forecast/latest \
  -H "Authorization: Bearer <token>"
```

---

## Alerts Endpoints

### List Alerts

#### Get All Alerts
```
GET /alerts/
```

**Description**: Retrieve all alerts with filtering options.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| vm_instance | string | Filter by VM instance |
| status | string | Filter by status (pending, acknowledged, resolved) |
| level | string | Filter by level (warning, critical) |

**Response** (200):
```json
[
  {
    "id": "alert-uuid",
    "vm_instance": "vm-001",
    "level": "warning",
    "status": "pending",
    "message": "VM-001 has reached 80% of monthly budget",
    "created_at": "2026-05-02T10:30:00Z",
    "acknowledged_at": null
  },
  {
    "id": "alert-uuid-2",
    "vm_instance": "vm-002",
    "level": "critical",
    "status": "acknowledged",
    "message": "VM-002 has exceeded 95% of monthly budget",
    "created_at": "2026-05-02T09:15:00Z",
    "acknowledged_at": "2026-05-02T09:20:00Z"
  }
]
```

**Example**:
```bash
curl "http://localhost:8000/alerts/?status=pending" \
  -H "Authorization: Bearer <token>"
```

---

### Create Alert/Budget

#### Create Budget Alert
```
POST /alerts/
```

**Description**: Create a budget alert for a specific VM.

**Authentication**: Required

**Request Body**:
```json
{
  "vm_instance": "vm-001",
  "monthly_limit": 500.00,
  "warning_threshold": 0.80,
  "critical_threshold": 0.95,
  "owner_email": "admin@cloudcost.local"
}
```

**Response** (201):
```json
{
  "id": "alert-uuid",
  "vm_instance": "vm-001",
  "budget_id": "budget-uuid",
  "monthly_limit": 500.00,
  "status": "active",
  "created_at": "2026-05-02T10:30:00Z"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/alerts/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "vm_instance": "vm-001",
    "monthly_limit": 500.00,
    "owner_email": "admin@cloudcost.local"
  }'
```

---

### Acknowledge Alert

#### Mark Alert as Acknowledged
```
PUT /alerts/{alert_id}/acknowledge
```

**Description**: Acknowledge an alert to indicate it has been reviewed.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| alert_id | string | Alert ID |

**Response** (200):
```json
{
  "id": "alert-uuid",
  "status": "acknowledged",
  "acknowledged_at": "2026-05-02T10:35:00Z"
}
```

**Example**:
```bash
curl -X PUT http://localhost:8000/alerts/alert-uuid/acknowledge \
  -H "Authorization: Bearer <token>"
```

---

## Metrics Endpoints

### Get Summary Metrics

#### Get System Metrics Summary
```
GET /metrics/summary
```

**Description**: Get aggregated metrics and KPIs for the entire system.

**Authentication**: Required

**Response** (200):
```json
{
  "total_vms": 5,
  "total_monthly_cost": 3456.78,
  "current_month_forecast": 3600.50,
  "total_active_alerts": 2,
  "cost_trend": -2.5,
  "avg_cost_per_vm": 691.36,
  "most_expensive_vm": "vm-001",
  "timestamp": "2026-05-02T10:30:00Z"
}
```

**Example**:
```bash
curl http://localhost:8000/metrics/summary \
  -H "Authorization: Bearer <token>"
```

---

### Get VM Metrics

#### Get Metrics for Specific VM
```
GET /metrics/vm/{instance}
```

**Description**: Get real-time metrics for a specific VM from Prometheus.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| instance | string | VM instance ID |

**Response** (200):
```json
{
  "instance": "vm-001",
  "cpu_usage_percent": 45.2,
  "memory_usage_percent": 62.8,
  "network_in_bytes": 1024000000,
  "network_out_bytes": 512000000,
  "disk_usage_percent": 72.1,
  "uptime_seconds": 864000,
  "timestamp": "2026-05-02T10:30:00Z"
}
```

**Example**:
```bash
curl http://localhost:8000/metrics/vm/vm-001 \
  -H "Authorization: Bearer <token>"
```

---

## Data Models

### VM Object
```json
{
  "instance": "vm-001",
  "label": "Production Server",
  "tariff_id": "standard",
  "cpu_cores": 4.0,
  "ram_gb": 8.0,
  "owner_email": "admin@cloudcost.local",
  "created_at": "2026-01-15T10:30:00Z"
}
```

### Tariff Object
```json
{
  "id": "standard",
  "name": "Standard Plan",
  "cpu_rate_per_core_hour": 0.048,
  "ram_rate_per_gb_hour": 0.006,
  "network_rate_per_gb": 0.010,
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### CostRecord Object
```json
{
  "id": "record-uuid",
  "vm_instance": "vm-001",
  "tariff_id": "standard",
  "period_start": "2026-04-26T00:00:00Z",
  "period_end": "2026-04-26T01:00:00Z",
  "cpu_cost": 18.24,
  "ram_cost": 7.68,
  "network_cost": 2.40,
  "total_cost": 28.32,
  "created_at": "2026-04-26T01:05:00Z"
}
```

### Alert Object
```json
{
  "id": "alert-uuid",
  "vm_instance": "vm-001",
  "level": "warning",
  "status": "pending",
  "message": "VM-001 has reached 80% of monthly budget",
  "created_at": "2026-05-02T10:30:00Z",
  "acknowledged_at": null
}
```

### Budget Object
```json
{
  "id": "budget-uuid",
  "vm_instance": "vm-001",
  "monthly_limit": 500.00,
  "warning_threshold": 0.80,
  "critical_threshold": 0.95,
  "owner_email": "admin@cloudcost.local",
  "active": true
}
```

---

## Examples

### Complete Workflow Example

#### 1. Login
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cloudcost.local",
    "password": "password"
  }' | jq -r '.access_token')

echo "Token: $TOKEN"
```

#### 2. Get All VMs
```bash
curl http://localhost:8000/vms/ \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 3. Get VM Cost History
```bash
curl "http://localhost:8000/vms/vm-001/cost?days=7" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### 4. Create Budget Alert
```bash
curl -X POST http://localhost:8000/alerts/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vm_instance": "vm-001",
    "monthly_limit": 500.00,
    "owner_email": "admin@cloudcost.local"
  }' | jq .
```

#### 5. Generate Forecast
```bash
curl -X POST http://localhost:8000/forecast/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "days_ahead": 7,
    "historical_days": 30
  }' | jq .
```

#### 6. Get Metrics Summary
```bash
curl http://localhost:8000/metrics/summary \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Rate Limiting

Rate limiting is configured at the application level. Current limits:
- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Billing/Forecast**: 5 requests per minute

Headers in response indicate rate limit status:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets

---

## Error Handling

### Common Error Response Format
```json
{
  "detail": "Error message describing what went wrong"
}
```

### Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "type": "value_error"
    }
  ]
}
```

### Best Practices
1. Always include authentication token for protected endpoints
2. Handle 401 errors by redirecting to login
3. Implement retry logic with exponential backoff for 5xx errors
4. Validate request data before sending
5. Log API errors for debugging

---

## Testing the API

### Using cURL
```bash
# Basic GET request
curl http://localhost:8000/health

# POST with JSON body
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cloudcost.local","password":"password"}'

# With authorization header
curl http://localhost:8000/vms/ \
  -H "Authorization: Bearer <token>"
```

### Using Postman
1. Import OpenAPI spec: http://localhost:8000/openapi.json
2. Create environment with base URL and token variable
3. Use pre-request scripts to auto-refresh tokens
4. Save requests in collections for team sharing

### Using Python
```python
import requests

BASE_URL = "http://localhost:8000"

# Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@cloudcost.local",
    "password": "password"
})
token = response.json()["access_token"]

# Authenticated request
headers = {"Authorization": f"Bearer {token}"}
vms = requests.get(f"{BASE_URL}/vms/", headers=headers).json()
print(vms)
```

---

**Document Version**: 1.0.0  
**Last Updated**: May 2, 2026  
**API Version**: 1.0.0
