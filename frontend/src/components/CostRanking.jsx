import { useState, useEffect } from "react";
import { api } from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from "recharts";

const COLORS = ["#ff4444", "#ffaa00", "#378ADD", "#1D9E75"];

export function CostRanking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const vms = await api.getAllVms();
      if (!vms?.length) return;
      const results = await Promise.all(
        vms.map(vm =>
          api.getVmCost(vm.instance, 30)
            .then(r => ({
              name:  vm.instance.split(":")[0],
              full:  vm.instance,
              total: parseFloat(r.total || 0),
            }))
            .catch(() => ({
              name:  vm.instance.split(":")[0],
              full:  vm.instance,
              total: 0,
            }))
        )
      );
      setRanking(results.sort((a, b) => b.total - a.total));
    } catch (e) {
      console.error("CostRanking error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  if (loading) return (
    <div style={{ padding: 20, color: "#888", fontSize: 13 }}>
      Loading cost ranking...
    </div>
  );

  if (!ranking.length) return (
    <div style={{ padding: 20, color: "#888", fontSize: 13 }}>
      No cost data available yet — run billing first
    </div>
  );

  const max   = ranking[0]?.total || 1;
  const total = ranking.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <h3 style={{ color: "#fff", fontWeight: 500,
                   fontSize: 14, marginBottom: 4 }}>
        VM cost ranking — last 30 days
      </h3>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
        Most expensive VMs ranked by total spend
      </p>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={ranking} layout="vertical"
                  margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333"
                         horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#888" }}
                 tickFormatter={v => `$${v.toFixed(3)}`} />
          <YAxis type="category" dataKey="name"
                 tick={{ fontSize: 11, fill: "#aaa" }} width={110} />
          <Tooltip
            contentStyle={{ background: "#1e1e2e", border: "1px solid #444",
                            borderRadius: 6, fontSize: 12 }}
            formatter={v => [`$${parseFloat(v).toFixed(4)}`, "30d cost"]}
          />
          <Bar dataKey="total" radius={[0, 4, 4, 0]}>
            {ranking.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: 12 }}>
        {ranking.map((vm, i) => (
          <div key={vm.full} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0", borderBottom: "1px solid #222"
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%",
              background: COLORS[i % COLORS.length],
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11,
              fontWeight: 600, color: "#fff", flexShrink: 0
            }}>{i + 1}</span>
            <code style={{ fontSize: 12, color: "#aaa", flex: 1 }}>
              {vm.full}
            </code>
            <span style={{ fontSize: 12, color: "#666" }}>
              {total > 0
                ? ((vm.total / total) * 100).toFixed(1)
                : "0"}% of total
            </span>
            <span style={{ fontSize: 14, fontWeight: 500,
                           color: COLORS[i % COLORS.length],
                           minWidth: 70, textAlign: "right" }}>
              ${vm.total.toFixed(4)}
            </span>
            <div style={{ width: 80, background: "#1e1e2e",
                          borderRadius: 3, height: 6 }}>
              <div style={{
                width: `${(vm.total / max) * 100}%`,
                background: COLORS[i % COLORS.length],
                height: "100%", borderRadius: 3
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: "10px 0",
                    borderTop: "1px solid #333",
                    display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#666" }}>
          Total spend (30 days)
        </span>
        <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
          ${total.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
