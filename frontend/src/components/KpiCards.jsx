import { useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

function Card({ label, value, sub, subColor, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "#2a2a3e", borderRadius: 10, padding: "16px 20px",
      border: "1px solid #333", cursor: onClick ? "pointer" : "default",
      transition: "border-color 0.2s"
    }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: "#fff" }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, marginTop: 4,
          color: subColor === "warning" ? "#ffaa00"
               : subColor === "danger"  ? "#ff4444"
               : subColor === "success" ? "#00aa55"
               : "#888" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export function KpiCards() {
  const fetchVms     = useCallback(() => api.getAllVms(), []);
  const fetchMetrics = useCallback(() => api.getLiveMetrics(), []);
  const fetchAlerts  = useCallback(() => api.getAlertSummary(), []);

  const { data: vms }     = usePolling(fetchVms,     30000);
  const { data: metrics } = usePolling(fetchMetrics, 15000);
  const { data: alerts }  = usePolling(fetchAlerts,  15000);

  const avgCpu = metrics?.length
    ? (metrics.reduce((s, m) => s + m.cpu_pct, 0) / metrics.length).toFixed(1)
    : "—";
  const avgRam = metrics?.length
    ? (metrics.reduce((s, m) => s + m.ram_pct, 0) / metrics.length).toFixed(1)
    : "—";
  const idleCount = metrics?.filter(m => m.cpu_pct < 5 && m.net_bps < 10000).length ?? 0;
  const alertCount = alerts?.total ?? 0;

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(4,1fr)",
      gap: 12, padding: "20px 24px"
    }}>
      <Card label="Monitored VMs"   value={vms?.length ?? "—"}
            sub={`${idleCount} idle detected`}
            subColor={idleCount > 0 ? "danger" : "success"} />
      <Card label="Avg CPU Usage"
            value={avgCpu === "—" ? "—" : `${avgCpu}%`}
            sub="across all VMs"
            subColor={parseFloat(avgCpu) > 80 ? "danger"
                    : parseFloat(avgCpu) > 50 ? "warning" : "success"} />
      <Card label="Avg RAM Usage"
            value={avgRam === "—" ? "—" : `${avgRam}%`}
            sub="across all VMs"
            subColor={parseFloat(avgRam) > 80 ? "danger"
                    : parseFloat(avgRam) > 50 ? "warning" : "success"} />
      <Card label="Active Alerts"
            value={alertCount}
            sub={alertCount > 0 ? "needs attention" : "all clear"}
            subColor={alertCount > 0 ? "warning" : "success"} />
    </div>
  );
}
