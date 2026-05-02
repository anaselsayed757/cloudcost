import { useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function StatusBar() {
  const fetchSummary = useCallback(() => api.getAlertSummary(), []);
  const { data } = usePolling(fetchSummary, 15000);

  return (
    <header style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "12px 24px", background: "#1e1e2e",
      borderBottom: "1px solid #333", flexWrap: "wrap"
    }}>
      <span style={{ fontWeight: 600, fontSize: 18, color: "#fff" }}>
        ☁ CloudCost Monitor
      </span>

      {data?.critical > 0 && (
        <span style={{ background: "#ff4444", color: "#fff",
          borderRadius: 5, padding: "2px 10px", fontSize: 12 }}>
          {data.critical} critical
        </span>
      )}
      {data?.warning > 0 && (
        <span style={{ background: "#ffaa00", color: "#000",
          borderRadius: 5, padding: "2px 10px", fontSize: 12 }}>
          {data.warning} warnings
        </span>
      )}
      {data?.total === 0 && (
        <span style={{ background: "#00aa55", color: "#fff",
          borderRadius: 5, padding: "2px 10px", fontSize: 12 }}>
          All systems healthy
        </span>
      )}

      <span style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
        Last updated: {new Date().toLocaleTimeString()}
      </span>
    </header>
  );
}
