import { useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function VmTable({ onSelectVm }) {
  const fetchMetrics = useCallback(() => api.getLiveMetrics(), []);
  const { data: metrics, loading } = usePolling(fetchMetrics, 15000);

  if (loading) return (
    <div style={{ padding: 24, color: "#888", fontSize: 13 }}>
      Loading VM metrics...
    </div>
  );

  return (
    <div>
      <h3 style={{ color: "#fff", fontWeight: 500,
                   marginBottom: 12, fontSize: 14 }}>
        VM status — live
        <span style={{ fontSize: 11, color: "#666",
                       marginLeft: 8 }}>click to view details</span>
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse",
                      fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333" }}>
            {["Instance","CPU %","RAM %","Net B/s",
              "Status","$/hr"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 10px",
                                   color: "#666", fontWeight: 500,
                                   fontSize: 12 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(metrics || []).map((vm) => {
            const idle    = vm.cpu_pct < 5 && vm.net_bps < 10000;
            const cpuHigh = vm.cpu_pct > 80;
            const cpuMid  = vm.cpu_pct > 50;
            const estCost = (
              (vm.cpu_pct / 100) * 2 * 0.048 +
              (vm.ram_pct / 100) * 2 * 0.006
            ).toFixed(4);
            return (
              <tr key={vm.instance}
                  onClick={() => onSelectVm && onSelectVm(vm.instance)}
                  style={{ borderBottom: "1px solid #222",
                           cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#333"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "10px 10px", color: "#ddd",
                             fontFamily: "monospace", fontSize: 11 }}>
                  {vm.instance}
                </td>
                <td style={{ padding: "10px 10px", fontWeight: 500,
                  color: cpuHigh ? "#ff4444" : cpuMid ? "#ffaa00" : "#00aa55" }}>
                  {vm.cpu_pct}%
                </td>
                <td style={{ padding: "10px 10px", fontWeight: 500,
                  color: vm.ram_pct > 80 ? "#ff4444"
                       : vm.ram_pct > 50 ? "#ffaa00" : "#00aa55" }}>
                  {vm.ram_pct}%
                </td>
                <td style={{ padding: "10px 10px", color: "#888" }}>
                  {vm.net_bps.toFixed(0)}
                </td>
                <td style={{ padding: "10px 10px" }}>
                  <span style={{
                    background: idle ? "#ff444422" : "#00aa5522",
                    color:      idle ? "#ff4444"   : "#00aa55",
                    borderRadius: 5, padding: "2px 8px",
                    fontSize: 11, fontWeight: 500
                  }}>
                    {idle ? "idle" : "active"}
                  </span>
                </td>
                <td style={{ padding: "10px 10px", color: "#aaa",
                             fontFamily: "monospace", fontSize: 11 }}>
                  ${estCost}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
