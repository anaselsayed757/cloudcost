import { useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function AlertPanel({ isAdmin = false }) {
  const fetchAlerts = useCallback(() => api.getAlerts("firing"), []);
  const { data: alerts, refresh } = usePolling(fetchAlerts, 15000);

  const acknowledge = async (id) => {
    await api.acknowledgeAlert(id);
    refresh();
  };

  const resolve = async (id) => {
    await api.resolveAlert(id);
    refresh();
  };

  const clearResolved = async () => {
    await api.clearResolvedAlerts();
    refresh();
  };

  const clearAll = async () => {
    if (!window.confirm("Clear all alerts? This cannot be undone.")) return;
    await api.clearAllAlerts();
    refresh();
  };

  if (!alerts?.length) return (
    <div style={{ padding: "14px 0", color: "#00aa55", fontSize: 13 }}>
      ✓ No active alerts — all systems healthy
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ color: "#fff", fontWeight: 500, margin: 0, fontSize: 14 }}>
          Active alerts
        </h3>
        {isAdmin && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
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
      </div>
      {alerts.map(alert => (
        <div key={alert.id} style={{
          background:  alert.severity === "critical" ? "#ff444418" : "#ffaa0018",
          borderLeft: `3px solid ${alert.severity === "critical" ? "#ff4444" : "#ffaa00"}`,
          borderRadius: "0 8px 8px 0",
          padding: "10px 14px", marginBottom: 8,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, marginRight: 8,
              color: alert.severity === "critical" ? "#ff4444" : "#ffaa00",
              textTransform: "uppercase", letterSpacing: "0.05em"
            }}>
              {alert.severity}
            </span>
            <span style={{ fontSize: 13, color: "#ddd" }}>
              {alert.message}
            </span>
            <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>
              {new Date(alert.triggered_at).toLocaleString()}
            </div>
          </div>
          <div style={{ marginLeft: 16, display: "flex", gap: 8 }}>
            {!alert.acknowledged && (
              <button onClick={() => acknowledge(alert.id)} style={{
                fontSize: 11, padding: "4px 12px",
                borderRadius: 5, border: "1px solid #555",
                background: "transparent", color: "#aaa",
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "border-color 0.2s"
              }}>
                Acknowledge
              </button>
            )}
            <button onClick={() => resolve(alert.id)} style={{
              fontSize: 11, padding: "4px 12px",
              borderRadius: 5, border: "1px solid #1D9E75",
              background: "transparent", color: "#1D9E75",
              cursor: "pointer", whiteSpace: "nowrap"
            }}>
              Resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
