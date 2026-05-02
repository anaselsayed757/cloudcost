# CloudCost - Development Guide

## Table of Contents
1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Coding Standards](#coding-standards)
4. [Backend Development](#backend-development)
5. [Frontend Development](#frontend-development)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Contributing](#contributing)
9. [Common Tasks](#common-tasks)

---

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Python 3.9+ (for backend development)
- Node.js 16+ (for frontend development)
- Git
- IDE: VS Code, PyCharm, or similar

### Initial Setup

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/cloudcost.git
cd cloudcost
```

#### 2. Create Virtual Environment (Backend)
```bash
# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows

# Install dependencies
cd backend
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies
```

#### 3. Setup Frontend Development
```bash
cd frontend
npm install

# Install development dependencies (optional)
npm install --save-dev eslint prettier
```

#### 4. Start Development Environment
```bash
# Terminal 1: Start Docker services (database, prometheus, etc.)
cd cloudcost
docker-compose up -d postgres prometheus grafana mailhog

# Terminal 2: Start backend (from cloudcost/backend)
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start frontend (from cloudcost/frontend)
npm start
```

### Verify Development Setup
```bash
# Backend running
curl http://localhost:8000/health

# Frontend running
curl http://localhost:3000

# Database accessible
psql postgresql://clouduser:cloudpass@localhost:5432/cloudcost

# Prometheus accessible
curl http://localhost:9090/api/v1/targets
```

---

## Project Structure

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization
│   ├── models.py               # SQLAlchemy models
│   ├── database.py             # Database connection
│   ├── auth.py                 # Authentication logic
│   ├── email_service.py        # Email sending
│   ├── prometheus_client.py    # Prometheus integration
│   ├── scheduler.py            # Background tasks
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py             # Auth endpoints
│   │   ├── vms.py              # VM endpoints
│   │   ├── billing.py          # Billing endpoints
│   │   ├── forecast.py         # Forecasting endpoints
│   │   ├── alerts.py           # Alert endpoints
│   │   └── metrics.py          # Metrics endpoints
│   │
│   ├── alerts/                 # Alert logic
│   ├── billing/                # Billing logic
│   └── forecasting/            # Forecasting models
│
├── migrations/                 # Alembic migrations
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies
├── Dockerfile                  # Container image
└── pytest.ini                  # Test configuration
```

### Frontend Structure
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── main.jsx                # Entry point
│   ├── App.jsx                 # Main component
│   │
│   ├── api/
│   │   └── client.js           # HTTP client
│   │
│   ├── components/
│   │   ├── Login.jsx           # Authentication UI
│   │   ├── KpiCards.jsx        # Dashboard cards
│   │   ├── CostChart.jsx       # Cost visualization
│   │   ├── VmTable.jsx         # VM list
│   │   ├── BudgetPanel.jsx     # Budget management
│   │   ├── AlertPanel.jsx      # Alert configuration
│   │   └── ... (other components)
│   │
│   ├── hooks/
│   │   ├── useTheme.js         # Theme management
│   │   └── usePolling.js       # Data polling
│   │
│   └── styles/                 # CSS files
│
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
└── Dockerfile                  # Container image
```

---

## Coding Standards

### Backend (Python/FastAPI)

#### Code Style
- **Style Guide**: PEP 8
- **Linter**: pylint, flake8
- **Formatter**: black
- **Type Hints**: Required for all functions

#### Formatting Rules
```python
# Code length: Max 100 characters per line
# Indentation: 4 spaces (NOT tabs)
# Imports: Group and sort (stdlib, third-party, local)

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import VM
from app.database import get_db
```

#### Naming Conventions
```python
# Functions and variables: snake_case
def calculate_total_cost(records: list) -> float:
    pass

# Classes: PascalCase
class VirtualMachine:
    pass

# Constants: UPPER_CASE
MAX_RECORDS_PER_PAGE = 100
DEFAULT_TARIFF_ID = "standard"

# Private methods/attributes: prefix with _
def _internal_helper():
    pass
```

#### Type Hints
```python
from typing import Optional, List, Dict, Union

# All function signatures should have type hints
async def get_vm(
    instance_id: str,
    db: AsyncSession
) -> Optional[VM]:
    """Get VM by instance ID."""
    pass

def process_records(records: List[Dict]) -> bool:
    """Process billing records."""
    pass
```

#### Docstrings
```python
def calculate_cost(
    cpu_percent: float,
    ram_percent: float,
    rate: float
) -> float:
    """
    Calculate resource cost based on usage percentage.

    Args:
        cpu_percent: CPU usage percentage (0-100)
        ram_percent: RAM usage percentage (0-100)
        rate: Cost rate per unit

    Returns:
        Total cost as float

    Raises:
        ValueError: If percentages are not between 0-100
    """
    pass
```

#### Error Handling
```python
from fastapi import HTTPException

# Use appropriate HTTP status codes
async def get_vm(instance: str):
    vm = await db.get_vm(instance)
    if not vm:
        raise HTTPException(
            status_code=404,
            detail=f"VM {instance} not found"
        )
    return vm

# Use logging for debugging
import logging
logger = logging.getLogger(__name__)

logger.info(f"Created VM: {instance}")
logger.error(f"Failed to create VM: {error}", exc_info=True)
```

### Frontend (React/JavaScript)

#### Code Style
- **Style Guide**: Airbnb style guide
- **Linter**: ESLint
- **Formatter**: Prettier
- **Browser Compatibility**: ES6+

#### Naming Conventions
```javascript
// Components: PascalCase
function VmCard({ vm }) {
  return <div>{vm.label}</div>;
}

// Functions and variables: camelCase
const calculateTotalCost = (records) => {
  return records.reduce((sum, r) => sum + r.cost, 0);
};

// Constants: UPPER_CASE
const MAX_ITEMS_PER_PAGE = 50;
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Private methods: prefix with _
const _formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};
```

#### Component Structure
```javascript
// Functional components with hooks
import { useState, useEffect } from 'react';

export function ComponentName({ propName, onAction }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchData();
      setState(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {state && <div>{state.name}</div>}
    </div>
  );
}
```

#### Props Validation
```javascript
import PropTypes from 'prop-types';

function VmCard({ vm, onSelect, disabled }) {
  return <button onClick={() => onSelect(vm)}>{vm.label}</button>;
}

VmCard.propTypes = {
  vm: PropTypes.shape({
    instance: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    cpu_cores: PropTypes.number,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

VmCard.defaultProps = {
  disabled: false,
};
```

---

## Backend Development

### Creating a New Endpoint

#### 1. Define Data Model
```python
# app/models.py
from sqlalchemy import Column, String, Float, DateTime
from app.database import Base
from datetime import datetime

class CustomData(Base):
    __tablename__ = "custom_data"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    value = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
```

#### 2. Create API Router
```python
# app/api/custom.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import CustomData
from pydantic import BaseModel

router = APIRouter(prefix="/custom", tags=["custom"])

# Pydantic schemas for validation
class CustomDataCreate(BaseModel):
    name: str
    value: float

class CustomDataResponse(BaseModel):
    id: str
    name: str
    value: float

# Endpoints
@router.get("/")
async def list_custom(
    db: AsyncSession = Depends(get_db)
) -> list[CustomDataResponse]:
    """Get all custom data."""
    result = await db.execute(select(CustomData))
    items = result.scalars().all()
    return items

@router.post("/")
async def create_custom(
    data: CustomDataCreate,
    db: AsyncSession = Depends(get_db)
) -> CustomDataResponse:
    """Create custom data."""
    item = CustomData(
        id=str(uuid.uuid4()),
        name=data.name,
        value=data.value
    )
    db.add(item)
    await db.commit()
    return item
```

#### 3. Register Router in main.py
```python
# app/main.py
from app.api import custom

app.include_router(custom.router)
```

#### 4. Test Endpoint
```bash
# Using curl
curl -X POST http://localhost:8000/custom/ \
  -H "Content-Type: application/json" \
  -d '{"name":"test","value":10.5}'

# Using Swagger UI
# Open http://localhost:8000/docs
```

### Database Migrations

#### Create Migration
```bash
# From backend directory
alembic revision --autogenerate -m "Add custom_data table"

# Check generated migration
cat migrations/versions/*.py
```

#### Apply Migration
```bash
# Apply all pending migrations
alembic upgrade head

# Downgrade to specific version
alembic downgrade -1
```

### Writing Tests

#### Unit Tests
```python
# backend/tests/test_models.py
import pytest
from app.models import VM
from app.database import engine, Base

@pytest.fixture
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_vm_creation(setup_db):
    vm = VM(
        instance="vm-test",
        label="Test VM",
        cpu_cores=2.0,
        ram_gb=4.0
    )
    assert vm.instance == "vm-test"
    assert vm.cpu_cores == 2.0
```

#### Integration Tests
```python
# backend/tests/test_api.py
@pytest.mark.asyncio
async def test_list_vms(client):
    response = await client.get(
        "/vms/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_vm(client):
    response = await client.post(
        "/vms/",
        json={"instance": "vm-new", "label": "New VM"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["instance"] == "vm-new"
```

#### Run Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_api.py

# Run with coverage
pytest --cov=app tests/

# Run in watch mode (requires pytest-watch)
ptw
```

---

## Frontend Development

### Creating a New Component

#### 1. Component File
```javascript
// src/components/CustomPanel.jsx
import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function CustomPanel({ vmInstance, theme }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [vmInstance]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/custom/${vmInstance}`);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (newValue) => {
    try {
      const response = await api.put(
        `/custom/${vmInstance}`,
        { value: newValue }
      );
      setData(response.data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{
      background: theme.surface,
      padding: 20,
      borderRadius: 12,
      border: `1px solid ${theme.border}`
    }}>
      <h3>{data?.name}</h3>
      <p>Value: {data?.value}</p>
      <button onClick={() => handleUpdate(data?.value + 1)}>
        Increase
      </button>
    </div>
  );
}
```

#### 2. Add to Main App
```javascript
// src/App.jsx
import { CustomPanel } from './components/CustomPanel';

function App() {
  const [selectedVm, setSelectedVm] = useState(null);

  return (
    <div>
      {/* Existing components */}
      {selectedVm && (
        <CustomPanel
          vmInstance={selectedVm}
          theme={theme}
        />
      )}
    </div>
  );
}
```

### API Client Setup

#### src/api/client.js
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Styling Components

#### Using Inline Styles (Current Approach)
```javascript
const cardStyle = {
  background: theme.surface,
  padding: 20,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  boxShadow: theme.isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
};

function Card({ children }) {
  return <div style={cardStyle}>{children}</div>;
}
```

#### Using CSS Modules (Recommended)
```css
/* src/styles/Card.module.css */
.card {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

```javascript
// src/components/Card.jsx
import styles from '../styles/Card.module.css';

function Card({ children }) {
  return <div className={styles.card}>{children}</div>;
}
```

---

## Testing

### Backend Testing

#### Setup Test Database
```bash
# Create test database
createdb cloudcost_test

# Or using Docker
docker-compose exec postgres \
  psql -U clouduser -c "CREATE DATABASE cloudcost_test"
```

#### Run Tests
```bash
# Run all tests
pytest

# Run specific test
pytest tests/test_api.py::test_list_vms

# Run with coverage report
pytest --cov=app --cov-report=html

# Run tests in parallel (faster)
pytest -n auto
```

### Frontend Testing

#### Setup Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Create test file
touch src/components/__tests__/VmCard.test.jsx
```

#### Write Tests
```javascript
// src/components/__tests__/VmCard.test.jsx
import { render, screen } from '@testing-library/react';
import { VmCard } from '../VmCard';

describe('VmCard', () => {
  it('renders VM label', () => {
    const vm = { instance: 'vm-001', label: 'Test VM' };
    render(<VmCard vm={vm} />);
    expect(screen.getByText('Test VM')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const vm = { instance: 'vm-001', label: 'Test VM' };
    const onSelect = jest.fn();
    render(<VmCard vm={vm} onSelect={onSelect} />);
    screen.getByRole('button').click();
    expect(onSelect).toHaveBeenCalledWith(vm);
  });
});
```

#### Run Frontend Tests
```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

---

## Debugging

### Backend Debugging

#### Using print/logging
```python
import logging

logger = logging.getLogger(__name__)

def calculate_cost(records):
    logger.debug(f"Calculating cost for {len(records)} records")
    total = sum(r.cost for r in records)
    logger.info(f"Total cost calculated: {total}")
    return total
```

#### Using pdb (Python Debugger)
```python
# Set breakpoint
import pdb; pdb.set_trace()

# Or use breakpoint() in Python 3.7+
breakpoint()

# When at breakpoint:
# n - next line
# s - step into
# c - continue
# l - list code
# p variable - print variable
```

#### Using VS Code Debugger
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload"],
      "jinja": true,
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

### Frontend Debugging

#### Browser DevTools
- Press `F12` to open DevTools
- Use Console tab for errors
- Use Network tab for API calls
- Use React DevTools browser extension

#### VS Code Debugger
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "React",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

#### Console Logging
```javascript
// Debug logs
console.log('Value:', value);
console.table(data);
console.time('operation');
// ... code ...
console.timeEnd('operation');
```

---

## Contributing

### Workflow

#### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
git checkout -b fix/your-bug-fix
git checkout -b docs/your-docs-update
```

#### 2. Make Changes
- Follow coding standards
- Write tests for new features
- Update documentation

#### 3. Commit Changes
```bash
git add .
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "docs: update guide"
```

#### 4. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/dependency updates

Example:
```
feat: add cost forecasting for VMs

Add ability to forecast costs based on historical
data using statistical models.

Closes #123
```

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes
- [ ] Performance impact considered
- [ ] Security implications reviewed

---

## Common Tasks

### Add New API Endpoint

1. Define Pydantic schema in router file
2. Create database model if needed
3. Write endpoint function with type hints
4. Add docstring and error handling
5. Write tests
6. Update API documentation

### Add New Frontend Component

1. Create component file with hooks
2. Add PropTypes validation
3. Integrate with existing components
4. Add styling (inline or CSS modules)
5. Write tests
6. Update app structure if needed

### Update Database Schema

1. Create new model in `app/models.py`
2. Create migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration file
4. Apply migration: `alembic upgrade head`
5. Update API endpoints if needed
6. Add tests

### Deploy Changes

1. Commit and push changes to main branch
2. Docker builds automatically (CI/CD)
3. Deploy to staging environment
4. Run integration tests
5. Deploy to production
6. Monitor for errors

### Debug Production Issue

1. Check logs: `docker-compose logs`
2. Check database: Query relevant tables
3. Check Prometheus metrics: CPU, memory, requests
4. Check recent deployments/changes
5. Create fix and test locally first
6. Deploy fix and verify

---

## Tools & Resources

### Development Tools
- **FastAPI Documentation**: https://fastapi.tiangolo.com
- **React Documentation**: https://react.dev
- **SQLAlchemy**: https://docs.sqlalchemy.org
- **Pytest**: https://docs.pytest.org
- **Vite**: https://vitejs.dev

### IDE Extensions (VS Code)
- Python (Microsoft)
- Pylance
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- Thunder Client (API testing)

### Design Resources
- **API Design**: https://restfulapi.net
- **Component Library**: https://headlessui.com
- **Icons**: https://heroicons.com

---

**Document Version**: 1.0.0  
**Last Updated**: May 2, 2026
