import { useCallback, useState, useEffect } from "react";
import { Login }           from "./components/Login";
import { KpiCards }        from "./components/KpiCards";
import { CostChart }       from "./components/CostChart";
import { ForecastChart }   from "./components/ForecastChart";
import { VmTable }         from "./components/VmTable";
import { VmDetail }        from "./components/VmDetail";
import { AlertPanel }      from "./components/AlertPanel";
import { AlertHistory }    from "./components/AlertHistory";
import { BudgetPanel }     from "./components/BudgetPanel";
import { TariffPanel }     from "./components/TariffPanel";
import { CostRanking }     from "./components/CostRanking";
import { UserManagement }  from "./components/UserManagement";
import { VmLabels }        from "./components/VmLabels";
import { StatusBar }       from "./components/StatusBar";
import { useTheme }        from "./hooks/useTheme";
import { api }             from "./api/client";
import { usePolling }      from "./hooks/usePolling";

function ActionBtn({ label, color, onClick, disabled, theme }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={disabled ? "Admin only" : ""}
      style={{
        padding: "8px 16px", borderRadius: 6, fontSize: 12,
        border: `1px solid ${disabled ? "#333" : (color || theme.border)}`,
        background: "transparent",
        color: disabled ? "#444" : (color || theme.textSub),
        cursor: disabled ? "not-allowed" : "pointer",
        marginRight: 8, opacity: disabled ? 0.5 : 1,
      }}>
      {label} {disabled ? "🔒" : ""}
    </button>
  );
}

function Card({ children, theme, style = {} }) {
  return (
    <div style={{
      background: theme.surface, borderRadius: 12,
      border: `1px solid ${theme.border}`,
      padding: 20, ...style
    }}>
      {children}
    </div>
  );
}

export default function App() {
  const [user,       setUser]       = useState(null);
  const [msg,        setMsg]        = useState("");
  const [selectedVm, setSelectedVm] = useState(null);
  const [activeTab,  setActiveTab]  = useState("dashboard");
  const { dark, toggle, theme }     = useTheme();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const token    = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role     = localStorage.getItem("role");
    if (token && username) setUser({ username, role });
  }, []);

  const fetchVms = useCallback(() => api.getAllVms(), []);
  const { data: vms } = usePolling(fetchVms, 60000);
  const instances = vms?.map(v => v.instance) ?? [];

  const flash = (text, color = "#00aa55") => {
    setMsg({ text, color });
    setTimeout(() => setMsg(""), 3000);
  };

  if (!user) return <Login onLogin={setUser} theme={theme} />;
  if (selectedVm) return (
    <VmDetail instance={selectedVm}
              onBack={() => setSelectedVm(null)}
              theme={theme} />
  );

  const tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "alerts",    label: "Alert History" },
    ...(isAdmin ? [
      { key: "users",   label: "Users" },
      { key: "labels",  label: "VM Labels" },
    ] : []),
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif",
                  background: theme.bg, minHeight: "100vh",
                  color: theme.text }}>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 16,
                       padding: "12px 24px", background: theme.headerBg,
                       borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ fontWeight: 600, fontSize: 18,
                       color: theme.text }}>☁ CloudCost Monitor</span>
        <StatusBar inline theme={theme} />

        {/* Nav tabs */}
        <div style={{ display: "flex", gap: 4, marginLeft: 16 }}>
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{ padding: "5px 12px", borderRadius: 6,
                       fontSize: 12, border: "none",
                       background: activeTab === tab.key
                         ? "#378ADD22" : "transparent",
                       color: activeTab === tab.key
                         ? "#378ADD" : theme.textSub,
                       cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex",
                      alignItems: "center", gap: 12 }}>
          <button onClick={toggle} style={{
            fontSize: 16, background: "transparent",
            border: `1px solid ${theme.border}`,
            borderRadius: 6, padding: "4px 10px",
            cursor: "pointer", color: theme.textSub
          }}>{dark ? "☀" : "🌙"}</button>

          <span style={{ fontSize: 12, color: theme.textSub }}>
            👤 {user.username}
            <span style={{ marginLeft: 6, fontSize: 10,
                           padding: "1px 6px", borderRadius: 4,
                           background: isAdmin
                             ? "#378ADD22" : "#1D9E7522",
                           color: isAdmin ? "#378ADD" : "#1D9E75"
                         }}>{user.role}</span>
          </span>
          <button onClick={() => { localStorage.clear(); setUser(null); }}
            style={{ fontSize: 12, padding: "4px 12px", borderRadius: 6,
                     border: `1px solid ${theme.border}`,
                     background: "transparent",
                     color: theme.textSub, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: "0 auto",
                     padding: "0 24px 40px" }}>

        {msg && (
          <div style={{ margin: "12px 0 0", padding: "10px 16px",
                        borderRadius: 8, background: theme.surface2,
                        border: `1px solid ${msg.color}`,
                        color: msg.color, fontSize: 13 }}>
            {msg.text}
          </div>
        )}

        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" && (
          <>
            <KpiCards theme={theme} />

            {/* Role banner for viewers */}
            {!isAdmin && (
              <div style={{ margin: "0 0 16px", padding: "10px 16px",
                            borderRadius: 8, background: "#1D9E7522",
                            border: "1px solid #1D9E75",
                            fontSize: 12, color: "#1D9E75" }}>
                👁 You are logged in as a <strong>viewer</strong> —
                read-only access. Contact an admin to make changes.
              </div>
            )}

            <div style={{ padding: "0 0 20px" }}>
              <ActionBtn theme={theme} label="Seed Tariffs"
                disabled={!isAdmin}
                onClick={() => api.seedData()
                  .then(() => flash("✓ Tariffs seeded"))} />
              <ActionBtn theme={theme} label="Run Billing Now"
                color="#378ADD" disabled={!isAdmin}
                onClick={() => api.runBilling()
                  .then(r => flash(`✓ Billed ${r.billed} VMs`))} />
              <ActionBtn theme={theme} label="Check Alerts"
                color="#ffaa00" disabled={!isAdmin}
                onClick={() => api.checkAlerts()
                  .then(r => flash(
                    r.fired > 0
                      ? `⚠ ${r.fired} idle alerts fired`
                      : "✓ No idle VMs",
                    r.fired > 0 ? "#ffaa00" : "#00aa55"))} />
              <ActionBtn theme={theme} label="Export CSV"
                color="#1D9E75"
                onClick={() => window.open(
                  `${process.env.REACT_APP_API_URL ||
                    "http://10.150.40.10:8000"}/billing/export`,
                  "_blank")} />
              <ActionBtn theme={theme} label="Send Receipt"
                color="#EF9F27"
                onClick={() => {
                  const clientEmail = window.prompt(
                    "Client email to bill (must match VM owner_email):",
                    "admin@cloudcost.local"
                  );
                  if (!clientEmail) return;
                  const recipientEmail = window.prompt(
                    "Recipient email to send the receipt to:",
                    clientEmail
                  ) || clientEmail;
                  const days = Number(window.prompt("Billing window in days:", "30") || 30);
                  api.sendReceipt(clientEmail, days, recipientEmail)
                    .then(r => flash(
                      r.sent
                        ? `✓ Receipt sent to ${r.recipient_email}`
                        : `⚠ Receipt failed for ${recipientEmail}`,
                      r.sent ? "#1D9E75" : "#ff4444"
                    ))
                    .catch(err => flash(`⚠ ${err.message}`, "#ff4444"));
                }} />
            </div>

            {/* Row 1: Cost chart + VM table */}
            <div style={{ display: "grid",
                          gridTemplateColumns: "1.4fr 1fr",
                          gap: 16, marginBottom: 16 }}>
              <Card theme={theme}><CostChart theme={theme} /></Card>
              <Card theme={theme}>
                <VmTable onSelectVm={setSelectedVm} theme={theme} />
              </Card>
            </div>

            {/* Row 2: Forecast + System info */}
            <div style={{ display: "grid",
                          gridTemplateColumns: "1.4fr 1fr",
                          gap: 16, marginBottom: 16 }}>
              <Card theme={theme}>
                <ForecastChart instances={instances} theme={theme} />
              </Card>
              <Card theme={theme}>
                <h3 style={{ color: theme.text, fontWeight: 500,
                             fontSize: 14, marginBottom: 12 }}>
                  System info
                </h3>
                <div style={{ display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 10 }}>
                  {[
                    { label: "Prometheus",  value: "Healthy",
                      color: "#00aa55" },
                    { label: "Database",    value: "Connected",
                      color: "#00aa55" },
                    { label: "Scrape",      value: "15s",
                      color: "#378ADD" },
                    { label: "Retention",   value: "30 days",
                      color: "#378ADD" },
                    { label: "Grafana",     value: ":3001",
                      color: "#EF9F27" },
                    { label: "Role",        value: user.role,
                      color: isAdmin ? "#378ADD" : "#1D9E75" },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: theme.surface2, borderRadius: 8,
                      padding: "10px 12px",
                      border: `1px solid ${theme.border}`
                    }}>
                      <div style={{ fontSize: 11,
                                    color: theme.textMuted,
                                    marginBottom: 3 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500,
                                    color: item.color }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Row 3: Cost ranking */}
            <Card theme={theme} style={{ marginBottom: 16 }}>
              <CostRanking theme={theme} />
            </Card>

            {/* Row 4: Budget + Tariff */}
            <div style={{ display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 16, marginBottom: 16 }}>
              <Card theme={theme}>
                <BudgetPanel vms={instances} theme={theme} />
              </Card>
              <Card theme={theme}>
                {isAdmin
                  ? <TariffPanel theme={theme} />
                  : <div style={{ color: theme.textMuted,
                                  fontSize: 13 }}>
                      🔒 Tariff management — admin only
                    </div>}
              </Card>
            </div>

            {/* Row 5: Active alerts */}
            <Card theme={theme}>
              <AlertPanel theme={theme} isAdmin={isAdmin} />
            </Card>
          </>
        )}

        {/* ── ALERT HISTORY TAB ── */}
        {activeTab === "alerts" && (
          <div style={{ marginTop: 20 }}>
            <Card theme={theme}>
              <AlertHistory theme={theme} isAdmin={isAdmin} />
            </Card>
          </div>
        )}

        {/* ── USERS TAB (admin only) ── */}
        {activeTab === "users" && isAdmin && (
          <div style={{ marginTop: 20 }}>
            <Card theme={theme}>
              <UserManagement theme={theme} />
            </Card>
          </div>
        )}

        {/* ── VM LABELS TAB (admin only) ── */}
        {activeTab === "labels" && isAdmin && (
          <div style={{ marginTop: 20 }}>
            <Card theme={theme}>
              <VmLabels theme={theme} />
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
