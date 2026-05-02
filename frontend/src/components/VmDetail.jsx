import { useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

export function VmDetail({ instance, onBack }) {
  const fetchMetrics  = useCallback(() => api.getLiveMetrics(), []);
  const fetchCost     = useCallback(() => api.getVmCost(instance, 7), [instance]);
  const fetchForecast = useCallback(() => api.getForecast(instance), [instance]);

  const { data: allMetrics } = usePolling(fetchMetrics, 15000);
  const { data: costData   } = usePolling(fetchCost,    30000);
  const { data: forecast   } = usePolling(fetchForecast, 60000);

  const vm = allMetrics?.find(m => m.instance === instance);

  const costChart = (costData?.records || []).map(r => ({
    date:    r.date?.split("T")[0] ?? r.date,
    cpu:     parseFloat(r.cpu_cost  || 0).toFixed(4),
    ram:     parseFloat(r.ram_cost  || 0).toFixed(4),
    network: parseFloat(r.network_cost || 0).toFixed(4),
    total:   parseFloat(r.total_cost || 0).toFixed(4),
  }));

  const forecastChart = (forecast?.daily_forecast || []).map((d, i) => ({
    date:  d.date.slice(5),
    lr:    parseFloat(forecast.models?.linear_regression?.[i] ?? 0).toFixed(4),
    arima: parseFloat(forecast.models?.arima?.[i] ?? 0).toFixed(4),
  }));

  return (
    <div style={{ fontFamily: "system-ui", background: "#13131f",
                  minHeight: "100vh", color: "#fff" }}>

      {/* Header */}
      <div style={{ background: "#1e1e2e", padding: "14px 24px",
                    borderBottom: "1px solid #333",
                    display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{
          background: "transparent", border: "1px solid #444",
          color: "#aaa", borderRadius: 6, padding: "6px 14px",
          cursor: "pointer", fontSize: 12
        }}>← Back</button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>☁ CloudCost Monitor</span>
        <span style={{ color: "#888", fontSize: 13 }}>/ VM Detail</span>
        <code style={{ background: "#2a2a3e", padding: "3px 10px",
                       borderRadius: 5, fontSize: 12,
                       color: "#378ADD" }}>{instance}</code>
      </div>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>

        {/* Live metrics cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                      gap: 12, marginBottom: 20 }}>
          {[
            { label: "CPU Usage",    value: vm ? `${vm.cpu_pct}%`    : "—",
              color: vm?.cpu_pct > 80 ? "#ff4444" : "#00aa55" },
            { label: "RAM Usage",    value: vm ? `${vm.ram_pct}%`    : "—",
              color: vm?.ram_pct > 80 ? "#ff4444" : "#00aa55" },
            { label: "Network B/s",  value: vm ? `${vm.net_bps.toFixed(0)}` : "—",
              color: "#378ADD" },
            { label: "Status",
              value: vm ? (vm.cpu_pct < 5 && vm.net_bps < 10000 ? "Idle" : "Active") : "—",
              color: vm?.cpu_pct < 5 ? "#ff4444" : "#00aa55" },
          ].map(card => (
            <div key={card.label} style={{
              background: "#2a2a3e", borderRadius: 10,
              padding: "16px 20px", border: "1px solid #333"
            }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 600,
                            color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Cost breakdown chart */}
        <div style={{ background: "#2a2a3e", borderRadius: 12,
                      border: "1px solid #333", padding: 20,
                      marginBottom: 16 }}>
          <h3 style={{ color: "#fff", fontWeight: 500,
                       fontSize: 14, marginBottom: 16 }}>
            Cost breakdown — last 7 days
          </h3>
          {costChart.length === 0 ? (
            <div style={{ color: "#888", fontSize: 13 }}>
              No billing history yet
            </div>
          ) : (
            <>
              {/* Total cost summary */}
              <div style={{ display: "flex", gap: 16,
                            marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Total 7d",   value: `$${costData?.total?.toFixed(4) ?? "0"}`,
                    color: "#fff" },
                  { label: "Avg/day",
                    value: `$${(costData?.total / Math.max(costChart.length,1)).toFixed(4)}`,
                    color: "#aaa" },
                  { label: "CPU cost",
                    value: `$${costChart.reduce((s,r) => s + parseFloat(r.cpu), 0).toFixed(4)}`,
                    color: "#378ADD" },
                  { label: "RAM cost",
                    value: `$${costChart.reduce((s,r) => s + parseFloat(r.ram), 0).toFixed(4)}`,
                    color: "#EF9F27" },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "#1e1e2e", borderRadius: 8,
                    padding: "8px 14px", border: "1px solid #333"
                  }}>
                    <div style={{ fontSize: 11, color: "#666" }}>{item.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 500,
                                  color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={costChart}
                          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }}
                         tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }}
                         tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#1e1e2e",
                                    border: "1px solid #444",
                                    borderRadius: 6, fontSize: 12 }}
                    formatter={v => [`$${parseFloat(v).toFixed(4)}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="cpu"  fill="#378ADD" name="CPU"
                       radius={[3,3,0,0]} />
                  <Bar dataKey="ram"  fill="#EF9F27" name="RAM"
                       radius={[3,3,0,0]} />
                  <Bar dataKey="network" fill="#1D9E75" name="Network"
                       radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        {/* Forecast chart */}
        <div style={{ background: "#2a2a3e", borderRadius: 12,
                      border: "1px solid #333", padding: 20 }}>
          <h3 style={{ color: "#fff", fontWeight: 500,
                       fontSize: 14, marginBottom: 12 }}>
            30-day forecast
          </h3>
          {forecast?.error ? (
            <div style={{ color: "#ffaa00", fontSize: 12 }}>
              {forecast.error}
            </div>
          ) : forecastChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={forecastChart}
                           margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }}
                         interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }}
                         tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "#1e1e2e",
                                    border: "1px solid #444",
                                    borderRadius: 6, fontSize: 12 }}
                    formatter={v => [`$${parseFloat(v).toFixed(4)}`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="lr" stroke="#7F77DD"
                        strokeWidth={2} dot={false} name="Linear Regression" />
                  <Line type="monotone" dataKey="arima" stroke="#EF9F27"
                        strokeWidth={2} strokeDasharray="5 3"
                        dot={false} name="ARIMA" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 16, marginTop: 8,
                            flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#7F77DD" }}>
                  LR — RMSE: {forecast.validation?.linear_regression?.rmse} |
                  MAPE: {forecast.validation?.linear_regression?.mape}%
                </span>
                <span style={{ fontSize: 11, color: "#EF9F27" }}>
                  ARIMA — RMSE: {forecast.validation?.arima?.rmse} |
                  MAPE: {forecast.validation?.arima?.mape}%
                </span>
                <span style={{ fontSize: 11, color: "#00aa55",
                               marginLeft: "auto" }}>
                  Winner: {forecast.recommended_model} |
                  30d total: ${forecast.total_30d_estimate}
                </span>
              </div>
            </>
          ) : (
            <div style={{ color: "#888", fontSize: 12 }}>
              Loading forecast...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
