# CloudCost - Frontend Components Documentation

## Table of Contents
1. [Component Overview](#component-overview)
2. [Core Components](#core-components)
3. [Page Components](#page-components)
4. [Utility Components](#utility-components)
5. [Hooks](#hooks)
6. [Theming System](#theming-system)
7. [Component Integration](#component-integration)

---

## Component Overview

The CloudCost frontend is built with React and organized into reusable components. Each component handles a specific aspect of the cost management system.

### Component Hierarchy
```
App
├── Login (if not authenticated)
└── Main Dashboard (if authenticated)
    ├── StatusBar
    ├── KpiCards
    ├── CostChart
    ├── ForecastChart
    ├── VmTable
    ├── VmDetail
    ├── BudgetPanel
    ├── AlertPanel
    ├── AlertHistory
    ├── TariffPanel
    ├── CostRanking
    ├── UserManagement
    └── VmLabels
```

---

## Core Components

### Login.jsx

**Purpose**: User authentication interface

**Props**:
```javascript
{
  onLoginSuccess: Function,    // Called after successful login
  theme: Object                // Theme configuration
}
```

**Features**:
- Email/password authentication
- Remember me option
- Error handling
- Token storage in localStorage

**Example**:
```javascript
import { Login } from './components/Login';

function App() {
  const handleLoginSuccess = (token, user) => {
    // Store token and user info
    setIsAuthenticated(true);
  };

  return <Login onLoginSuccess={handleLoginSuccess} theme={theme} />;
}
```

**State**:
- `email`: User email address
- `password`: User password
- `loading`: Login in progress
- `error`: Error message if login failed

---

### KpiCards.jsx

**Purpose**: Display key performance indicators on dashboard

**Props**:
```javascript
{
  data: {
    totalVms: Number,
    totalCost: Number,
    monthlyForecast: Number,
    activeAlerts: Number,
    costTrend: Number,
    avgCostPerVm: Number
  },
  theme: Object
}
```

**Features**:
- Displays 6 key metrics
- Shows cost trends (up/down)
- Real-time data updates
- Color-coded indicators

**Data Displayed**:
1. **Total VMs**: Number of virtual machines
2. **Total Monthly Cost**: Sum of all VM costs this month
3. **Forecasted Cost**: Predicted cost for rest of month
4. **Active Alerts**: Number of unresolved alerts
5. **Cost Trend**: Percentage change from previous month
6. **Average Cost**: Mean cost per VM

**Example**:
```javascript
const metrics = {
  totalVms: 5,
  totalCost: 3456.78,
  monthlyForecast: 3600.50,
  activeAlerts: 2,
  costTrend: -2.5,
  avgCostPerVm: 691.36
};

<KpiCards data={metrics} theme={theme} />
```

---

### CostChart.jsx

**Purpose**: Visualize historical cost data with Recharts

**Props**:
```javascript
{
  data: Array,        // Historical cost records
  timeRange: String,  // '7d', '30d', '90d'
  theme: Object
}
```

**Data Format**:
```javascript
[
  {
    date: "2026-04-26",
    cpu_cost: 18.24,
    ram_cost: 7.68,
    network_cost: 2.40,
    total_cost: 28.32
  },
  // ... more records
]
```

**Features**:
- Line chart showing cost trends
- Stacked area chart for cost breakdown
- Tooltip on hover
- Responsive sizing
- Time range selector (7d, 30d, 90d)

**Example**:
```javascript
<CostChart 
  data={costHistory} 
  timeRange="30d"
  theme={theme}
/>
```

---

### ForecastChart.jsx

**Purpose**: Display cost predictions using forecasting model

**Props**:
```javascript
{
  data: Array,        // Forecasted data
  theme: Object
}
```

**Data Format**:
```javascript
[
  {
    date: "2026-05-03",
    predicted_cost: 28.50,
    confidence_lower: 27.20,
    confidence_upper: 29.80
  },
  // ... more predictions
]
```

**Features**:
- Shows predicted costs
- Displays confidence interval (shaded area)
- Upper and lower bounds
- Interactive legend

**Example**:
```javascript
<ForecastChart 
  data={forecast} 
  theme={theme}
/>
```

---

## Page Components

### VmTable.jsx

**Purpose**: Display and manage list of virtual machines

**Props**:
```javascript
{
  vms: Array,                    // List of VMs
  selectedVm: Object,            // Currently selected VM
  onSelectVm: Function,          // Selection callback
  onUpdateVm: Function,          // Update callback
  onDeleteVm: Function,          // Delete callback
  theme: Object
}
```

**VM Object Structure**:
```javascript
{
  instance: "vm-001",
  label: "Production Server",
  tariff_id: "standard",
  cpu_cores: 4.0,
  ram_gb: 8.0,
  owner_email: "admin@cloudcost.local",
  created_at: "2026-01-15T10:30:00Z"
}
```

**Features**:
- Table view with sorting and filtering
- Inline editing
- Selection/highlighting
- Action buttons (edit, delete, view details)
- Pagination
- Search functionality

**Columns**:
1. Instance ID
2. Label
3. CPU Cores
4. RAM (GB)
5. Tariff
6. Owner
7. Actions

**Example**:
```javascript
<VmTable
  vms={vmList}
  selectedVm={selected}
  onSelectVm={setSelected}
  onUpdateVm={handleUpdate}
  theme={theme}
/>
```

---

### VmDetail.jsx

**Purpose**: Display detailed information and metrics for selected VM

**Props**:
```javascript
{
  vm: Object,           // VM object
  costHistory: Array,   // Historical costs
  currentMetrics: Object, // Real-time metrics
  onClose: Function,    // Close callback
  theme: Object
}
```

**Displayed Information**:
- VM configuration (CPU, RAM, tariff)
- Current resource usage (CPU%, RAM%, Network)
- Uptime and status
- Owner information
- Cost summary
- Recent cost records

**Example**:
```javascript
<VmDetail
  vm={selectedVm}
  costHistory={costs}
  currentMetrics={metrics}
  onClose={handleClose}
  theme={theme}
/>
```

---

### BudgetPanel.jsx

**Purpose**: Set and manage VM budgets with alerts

**Props**:
```javascript
{
  vm: Object,              // VM object
  budget: Object,          // Budget configuration
  onSaveBudget: Function,  // Save callback
  onDeleteBudget: Function, // Delete callback
  theme: Object
}
```

**Budget Object**:
```javascript
{
  id: "budget-uuid",
  vm_instance: "vm-001",
  monthly_limit: 500.00,
  warning_threshold: 0.80,
  critical_threshold: 0.95,
  owner_email: "admin@cloudcost.local",
  active: true
}
```

**Features**:
- Set monthly budget limit
- Configure warning threshold (default 80%)
- Configure critical threshold (default 95%)
- Visual progress indicator
- Estimated days remaining
- Email notifications toggle

**Example**:
```javascript
<BudgetPanel
  vm={selectedVm}
  budget={currentBudget}
  onSaveBudget={handleSave}
  theme={theme}
/>
```

---

### AlertPanel.jsx

**Purpose**: Create and configure alerts

**Props**:
```javascript
{
  vm: Object,            // VM object
  alerts: Array,         // Existing alerts
  onCreateAlert: Function, // Create callback
  onDeleteAlert: Function, // Delete callback
  theme: Object
}
```

**Features**:
- Create alert conditions
- Set alert levels (warning, critical)
- Configure notification methods
- Alert templates
- Manual alert triggering

**Example**:
```javascript
<AlertPanel
  vm={selectedVm}
  alerts={vmAlerts}
  onCreateAlert={handleCreate}
  theme={theme}
/>
```

---

### AlertHistory.jsx

**Purpose**: Display historical alerts and acknowledgments

**Props**:
```javascript
{
  alerts: Array,         // All alerts
  filter: Object,        // Filter criteria
  onAcknowledge: Function, // Acknowledge callback
  theme: Object
}
```

**Alert Object**:
```javascript
{
  id: "alert-uuid",
  vm_instance: "vm-001",
  level: "warning",
  status: "pending",
  message: "VM-001 reached 80% of monthly budget",
  created_at: "2026-05-02T10:30:00Z",
  acknowledged_at: null
}
```

**Features**:
- List all alerts with filtering
- Status indicators (pending, acknowledged, resolved)
- Level indicators (warning, critical)
- Quick acknowledgment
- Time filters
- Search functionality

**Example**:
```javascript
<AlertHistory
  alerts={allAlerts}
  filter={{ status: 'pending' }}
  onAcknowledge={handleAck}
  theme={theme}
/>
```

---

## Utility Components

### TariffPanel.jsx

**Purpose**: Manage and configure pricing tariffs

**Props**:
```javascript
{
  tariffs: Array,        // Available tariffs
  onAddTariff: Function, // Add callback
  onEditTariff: Function, // Edit callback
  onDeleteTariff: Function, // Delete callback
  theme: Object
}
```

**Tariff Object**:
```javascript
{
  id: "standard",
  name: "Standard Plan",
  cpu_rate_per_core_hour: 0.048,
  ram_rate_per_gb_hour: 0.006,
  network_rate_per_gb: 0.010
}
```

**Features**:
- Create custom tariffs
- Edit existing tariffs
- Delete unused tariffs
- Currency display
- Rate preview/calculator

**Example**:
```javascript
<TariffPanel
  tariffs={tariffList}
  onAddTariff={handleAdd}
  onEditTariff={handleEdit}
  theme={theme}
/>
```

---

### CostRanking.jsx

**Purpose**: Display VMs ranked by cost

**Props**:
```javascript
{
  vms: Array,           // VM list with costs
  onSelectVm: Function, // Selection callback
  theme: Object
}
```

**VM Cost Data**:
```javascript
[
  {
    instance: "vm-001",
    label: "Production",
    totalCost: 456.78,
    percentOfTotal: 32.5
  },
  // ... more VMs
]
```

**Features**:
- Ranked list by cost
- Percentage of total cost
- Color coding by cost level
- Click to view details
- Cost breakdown tooltips

**Example**:
```javascript
<CostRanking
  vms={vmCosts}
  onSelectVm={handleSelect}
  theme={theme}
/>
```

---

### UserManagement.jsx

**Purpose**: Admin panel for managing users

**Props**:
```javascript
{
  users: Array,          // List of users
  onAddUser: Function,   // Add callback
  onEditUser: Function,  // Edit callback
  onDeleteUser: Function, // Delete callback
  theme: Object
}
```

**User Object**:
```javascript
{
  id: "user-uuid",
  email: "user@example.com",
  role: "user", // or "admin"
  created_at: "2026-01-15T10:30:00Z",
  last_login: "2026-05-02T10:30:00Z"
}
```

**Features**:
- List all users
- Add new users
- Edit user roles
- Delete users
- Activity tracking
- Permission management

**Example** (Admin only):
```javascript
{isAdmin && (
  <UserManagement
    users={userList}
    onAddUser={handleAdd}
    theme={theme}
  />
)}
```

---

### VmLabels.jsx

**Purpose**: Manage VM labels and metadata

**Props**:
```javascript
{
  vms: Array,            // VM list
  onUpdateLabels: Function, // Update callback
  theme: Object
}
```

**Features**:
- Edit VM labels
- Add custom tags
- Bulk labeling
- Label suggestions
- Search by label

**Example**:
```javascript
<VmLabels
  vms={vmList}
  onUpdateLabels={handleUpdate}
  theme={theme}
/>
```

---

### StatusBar.jsx

**Purpose**: Display system status and quick actions

**Props**:
```javascript
{
  status: Object,        // System status
  onRefresh: Function,   // Refresh callback
  onLogout: Function,    // Logout callback
  user: Object,          // Current user
  theme: Object
}
```

**Status Object**:
```javascript
{
  systemHealth: "healthy", // or "warning", "critical"
  lastUpdate: "2026-05-02T10:30:00Z",
  dataFreshness: "2m",
  activeUsers: 5
}
```

**Features**:
- System health indicator
- Last update timestamp
- User info and logout
- Refresh button
- Data sync status

**Example**:
```javascript
<StatusBar
  status={sysStatus}
  user={currentUser}
  onLogout={handleLogout}
  theme={theme}
/>
```

---

## Hooks

### useTheme.js

**Purpose**: Manage light/dark theme throughout application

**Usage**:
```javascript
import { useTheme } from './hooks/useTheme';

function MyComponent() {
  const theme = useTheme();

  return (
    <div style={{
      background: theme.surface,
      color: theme.text,
      border: `1px solid ${theme.border}`
    }}>
      Content
    </div>
  );
}
```

**Theme Object**:
```javascript
{
  isDark: Boolean,
  background: String,
  surface: String,
  text: String,
  textSub: String,
  border: String,
  primary: String,
  success: String,
  warning: String,
  error: String
}
```

---

### usePolling.js

**Purpose**: Automatically fetch data at intervals

**Usage**:
```javascript
import { usePolling } from './hooks/usePolling';

function Dashboard() {
  const { data, loading, error } = usePolling(
    '/api/metrics/summary',
    5000  // Poll every 5 seconds
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{data.totalCost}</div>;
}
```

**Parameters**:
- `url`: API endpoint to poll
- `interval`: Poll interval in milliseconds (default: 30000)

**Returns**:
```javascript
{
  data: Object,        // Latest data
  loading: Boolean,    // Currently fetching
  error: String,       // Error message if any
  refetch: Function    // Manual refresh function
}
```

---

## Theming System

### Built-in Themes

#### Light Theme
```javascript
const lightTheme = {
  isDark: false,
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#333333',
  textSub: '#666666',
  border: '#e0e0e0',
  primary: '#2196f3',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};
```

#### Dark Theme
```javascript
const darkTheme = {
  isDark: true,
  background: '#1a1a1a',
  surface: '#2d2d2d',
  text: '#f5f5f5',
  textSub: '#b0b0b0',
  border: '#444444',
  primary: '#42a5f5',
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350'
};
```

### Custom Styling Pattern

```javascript
const cardStyle = (theme) => ({
  background: theme.surface,
  borderRadius: 12,
  border: `1px solid ${theme.border}`,
  padding: 20,
  color: theme.text,
  boxShadow: theme.isDark 
    ? '0 2px 8px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.1)'
});

function Card({ children, theme }) {
  return <div style={cardStyle(theme)}>{children}</div>;
}
```

---

## Component Integration

### Data Flow Pattern

```javascript
// App.jsx - Main orchestrator
function App() {
  const [vms, setVms] = useState([]);
  const [selectedVm, setSelectedVm] = useState(null);
  const [costData, setCostData] = useState([]);
  const theme = useTheme();

  // Fetch data on mount
  useEffect(() => {
    fetchVms();
    fetchCostData();
  }, []);

  const fetchVms = async () => {
    try {
      const response = await api.get('/vms/');
      setVms(response.data);
    } catch (error) {
      console.error('Failed to fetch VMs', error);
    }
  };

  const fetchCostData = async () => {
    try {
      const response = await api.get('/vms/' + selectedVm?.instance + '/cost');
      setCostData(response.data);
    } catch (error) {
      console.error('Failed to fetch cost data', error);
    }
  };

  return (
    <div style={{ background: theme.background }}>
      <StatusBar user={user} onLogout={handleLogout} theme={theme} />
      <KpiCards data={metrics} theme={theme} />
      <VmTable 
        vms={vms} 
        selectedVm={selectedVm}
        onSelectVm={setSelectedVm}
        theme={theme}
      />
      {selectedVm && (
        <VmDetail vm={selectedVm} costHistory={costData} theme={theme} />
      )}
    </div>
  );
}
```

### Common Props Pattern

All components should accept:
```javascript
{
  // Required
  theme: Object,

  // Optional data
  data: Object | Array,

  // Optional callbacks
  onAction: Function,
  onSelect: Function,
  onClose: Function,

  // Optional display
  disabled: Boolean,
  loading: Boolean
}
```

---

## Component Lifecycle

### Mounting
1. Component renders with default state
2. `useEffect` hook fetches initial data
3. State updated, component re-renders
4. Data displayed to user

### Updating
1. User interacts (click, type, etc.)
2. Event handler triggered
3. State updated
4. Component re-renders
5. API call if needed

### Unmounting
1. Component removed from DOM
2. Event listeners cleaned up
3. Pending API calls cancelled
4. Resources freed

### Example with Lifecycle
```javascript
function VmCard({ vm, onSelect, theme }) {
  const [expanded, setExpanded] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Fetch metrics when expanded
    if (expanded) {
      fetchMetrics();
    }

    return () => {
      // Cleanup when component unmounts
      // Cancel any pending requests
    };
  }, [expanded, vm.instance]);

  const fetchMetrics = async () => {
    const data = await api.get(`/metrics/vm/${vm.instance}`);
    setMetrics(data);
  };

  return (
    <div onClick={() => {
      setExpanded(!expanded);
      onSelect(vm);
    }}>
      {vm.label}
      {expanded && <MetricsDisplay metrics={metrics} />}
    </div>
  );
}
```

---

**Document Version**: 1.0.0  
**Last Updated**: May 2, 2026
