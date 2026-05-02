import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function AlertHistory({ isAdmin = false }) {
  const [filter, setFilter] = useState("all");

  const fetchAlerts = useCallback(
    () => api.getAlerts(filter), [filter]
  );
  const { data: alerts, loading, refresh } = usePolling(fetchAlerts, 30000);

  const clearResolved = async () => {
    await api.clearResolvedAlerts();
    refresh();
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all alerts? This cannot be undone.")) return;
    await api.clearAllAlerts();
    refresh();
  };

  const counts = {
    all:     alerts?.length ?? 0,
    firing:  alerts?.filter(a => !a.resolved_at).length ?? 0,
    resolved: alerts?.filter(a => a.resolved_at).length ?? 0,
  };

  return (
    <div>
      <h3 style={{ color: "#fff", fontWeight: 500,
                   fontSize: 14, marginBottom: 4 }}>
        Alert history
      </h3>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        Full log of all alerts — firing and resolved
      </p>

      {isAdmin && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={clearResolved} style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 5,
            border: "1px solid #555", background: "transparent",
            color: "#bbb", cursor: "pointer"
          }}>
            Clear resolved
          </button>
          <button onClick={clearAll} style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 5,
            border: "1px solid #7a3030", background: "transparent",
            color: "#ff8888", cursor: "pointer"
          }}>
            Clear all
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "all",      label: "All" },
          { key: "firing",   label: "Firing" },
          { key: "resolved", label: "Resolved" },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "5px 14px", borderRadius: 6, fontSize: 12,
              border: `1px solid ${filter === tab.key
                ? "#378ADD" : "#444"}`,
              background: filter === tab.key ? "#378ADD22" : "transparent",
              color: filter === tab.key ? "#378ADD" : "#888",
              cursor: "pointer"
            }}>
            {tab.label}
            <span style={{ marginLeft: 6, fontSize: 10,
                           background: "#2a2a3e", padding: "1px 5px",
                           borderRadius: 10, color: "#aaa" }}>
              {tab.key === "all"
                ? alerts?.length ?? 0
                : tab.key === "firing"
                ? alerts?.filter(a => !a.resolved_at).length ?? 0
                : alerts?.filter(a => a.resolved_at).length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#888", fontSize: 13 }}>
          Loading alert history...
        </div>
      ) : !alerts?.length ? (
        <div style={{ color: "#888", fontSize: 13 }}>
          No alerts found
        </div>
      ) : (
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{
              background: alert.resolved_at
                ? "#1e1e2e"
                : alert.severity === "critical"
                ? "#ff444418" : "#ffaa0018",
              borderLeft: `3px solid ${
                alert.resolved_at ? "#444"
                : alert.severity === "critical"
                ? "#ff4444" : "#ffaa00"}`,
              borderRadius: "0 8px 8px 0",
              padding: "10px 14px", marginBottom: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center",
                            gap: 10, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", borderRadius: 4,
                  background: alert.resolved_at
                    ? "#444" : alert.severity === "critical"
                    ? "#ff444433" : "#ffaa0033",
                  color: alert.resolved_at
                    ? "#888" : alert.severity === "critical"
                    ? "#ff4444" : "#ffaa00",
                  textTransform: "uppercase"
                }}>
                  {alert.resolved_at ? "resolved" : alert.severity}
                </span>
                <span style={{ fontSize: 11, color: "#666" }}>
                  {alert.alert_type}
                </span>
                <span style={{ fontSize: 11, color: "#555",
                               marginLeft: "auto" }}>
                  {new Date(alert.triggered_at).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#ddd" }}>
                {alert.message}
              </div>
              {alert.resolved_at && (
                <div style={{ fontSize: 11, color: "#555",
                              marginTop: 4 }}>
                  Resolved: {new Date(alert.resolved_at).toLocaleString()}
                </div>
              )}
              {alert.acknowledged && (
                <div style={{ fontSize: 11, color: "#1D9E75",
                              marginTop: 2 }}>✓ Acknowledged</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
