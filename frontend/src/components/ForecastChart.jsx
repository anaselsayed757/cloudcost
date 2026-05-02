import { useState, useCallback, useEffect } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from "recharts";

export function ForecastChart({ instances }) {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (instances?.length && !selected) {
      setSelected(instances[0]);
    }
  }, [instances]);

  const fetchForecast = useCallback(async () => {
    const inst = selected || instances?.[0];
    if (!inst) return null;
    try {
      return await api.getForecast(inst);
    } catch {
      return null;
    }
  }, [selected, instances]);

  const { data: forecast } = usePolling(fetchForecast, 60000);

  const chartData = forecast?.daily_forecast?.map((d, i) => ({
    date:  d.date.slice(5),
    lr:    parseFloat(forecast.models?.linear_regression?.[i] ?? 0).toFixed(4),
    arima: parseFloat(forecast.models?.arima?.[i] ?? 0).toFixed(4),
  })) ?? [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ color: "#fff", fontWeight: 500, fontSize: 14, margin: 0 }}>
          30-day forecast
        </h3>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          style={{ background: "#1e1e2e", color: "#aaa",
                   border: "1px solid #444", borderRadius: 5,
                   padding: "3px 8px", fontSize: 11 }}>
          {(instances || []).map(i => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      {!forecast ? (
        <div style={{ color: "#888", fontSize: 12, padding: "12px 0" }}>
          Loading forecast...
        </div>
      ) : forecast?.error ? (
        <div style={{ color: "#ffaa00", fontSize: 12, padding: "12px 0" }}>
          {forecast.error}
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}
                       margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }}
                     interval={4} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }}
                     tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#1e1e2e", border: "1px solid #444",
                                borderRadius: 6, fontSize: 12 }}
                formatter={(v) => [`$${parseFloat(v).toFixed(4)}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
              <Line type="monotone" dataKey="lr"
                    stroke="#7F77DD" strokeWidth={2}
                    dot={false} name="Linear Regression" />
              <Line type="monotone" dataKey="arima"
                    stroke="#EF9F27" strokeWidth={2}
                    strokeDasharray="5 3"
                    dot={false} name="ARIMA" />
            </LineChart>
          </ResponsiveContainer>

          {forecast?.validation && (
            <div style={{ display: "flex", gap: 16, marginTop: 8,
                          flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#7F77DD" }}>
                LR — RMSE: {forecast.validation.linear_regression?.rmse} |
                MAPE: {forecast.validation.linear_regression?.mape}%
              </span>
              <span style={{ fontSize: 11, color: "#EF9F27" }}>
                ARIMA — RMSE: {forecast.validation.arima?.rmse} |
                MAPE: {forecast.validation.arima?.mape}%
              </span>
              <span style={{ fontSize: 11, color: "#00aa55",
                             marginLeft: "auto" }}>
                Winner: {forecast.recommended_model} |
                30d: ${forecast.total_30d_estimate}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
