import { useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function StatusBar({ theme }) {
  const fetchSummary = useCallback(() => api.getAlertSummary(), []);
  const { data } = usePolling(fetchSummary, 15000);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
      <span style={{ fontSize: 12, color: theme?.textSub || "#888" }}>
        Last updated: {new Date().toLocaleTimeString()}
      </span>
    </div>
  );
}
