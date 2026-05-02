import { useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid
} from "recharts";

export function CostChart() {
  const fetchVms = useCallback(() => api.getAllVms(), []);
  const { data: vms } = usePolling(fetchVms, 60000);

  const fetchCosts = useCallback(async () => {
    if (!vms?.length) return [];
    const results = await Promise.all(
      vms.map(vm => api.getVmCost(encodeURIComponent(vm.instance), 7))
    );
    const dateMap = {};
    results.forEach((r, i) => {
      const vmName = vms[i].instance.split(":")[0];
      (r.records || []).forEach(rec => {
        const d = rec.date?.split("T")[0] ?? rec.date;
        if (!dateMap[d]) dateMap[d] = { date: d };
        dateMap[d][vmName] = parseFloat(rec.total_cost || 0).toFixed(4);
      });
    });
    return Object.values(dateMap).sort((a, b) => a.date > b.date ? 1 : -1);
  }, [vms]);

  const { data: chartData } = usePolling(fetchCosts, 60000);

  const COLORS = ["#378ADD", "#EF9F27", "#1D9E75", "#D85A30"];
  const vmNames = vms?.map(v => v.instance.split(":")[0]) ?? [];

  if (!chartData?.length) return (
    <div style={{ padding: 24, color: "#888", fontSize: 13 }}>
      Loading cost history...
    </div>
  );

  return (
    <div>
      <h3 style={{ color: "#fff", fontWeight: 500,
                   marginBottom: 12, fontSize: 14 }}>
        Daily cost history — last 7 days
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#888" }}
                 tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fontSize: 11, fill: "#888" }}
                 tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: "#1e1e2e", border: "1px solid #444",
                            borderRadius: 6, fontSize: 12 }}
            formatter={(v) => [`$${parseFloat(v).toFixed(4)}`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#888" }} />
          {vmNames.map((name, i) => (
            <Bar key={name} dataKey={name}
                 fill={COLORS[i % COLORS.length]}
                 radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
