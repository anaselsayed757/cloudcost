import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

function BudgetRow({ vm, totalCost }) {
  const fetchBudget = useCallback(() => api.getBudget(vm), [vm]);
  const { data: budgetData, refresh } = usePolling(fetchBudget, 30000);

  const [editing, setEditing] = useState(false);
  const [limit,   setLimit]   = useState("");
  const [email,   setEmail]   = useState("admin@cloudcost.local");
  const [saving,  setSaving]  = useState(false);

  const budget = budgetData?.budget;
  const spent  = totalCost || 0;
  const pct    = budget ? Math.min((spent / budget.monthly_limit) * 100, 100) : 0;
  const color  = pct >= 95 ? "#ff4444" : pct >= 80 ? "#ffaa00" : "#00aa55";

  const handleSave = async () => {
    if (!limit || isNaN(parseFloat(limit))) return;
    setSaving(true);
    await api.setBudget(vm, parseFloat(limit), email);
    await refresh();
    setEditing(false);
    setSaving(false);
  };

  return (
    <div style={{ padding: "14px 0", borderBottom: "1px solid #222" }}>
      <div style={{ display: "flex", alignItems: "center",
                    gap: 12, marginBottom: 8 }}>
        <code style={{ fontSize: 12, color: "#378ADD",
                       background: "#1e1e2e", padding: "2px 8px",
                       borderRadius: 4, flex: 1 }}>{vm}</code>
        <span style={{ fontSize: 12, color: "#888" }}>
          Spent: <span style={{ color: "#fff" }}>${spent.toFixed(4)}</span>
        </span>
        {budget && (
          <span style={{ fontSize: 12, color: "#888" }}>
            Limit: <span style={{ color }}>${budget.monthly_limit}</span>
          </span>
        )}
        <button onClick={() => { setEditing(!editing); setLimit(""); }}
          style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5,
                   border: "1px solid #444", background: "transparent",
                   color: "#aaa", cursor: "pointer" }}>
          {editing ? "Cancel" : budget ? "Edit" : "Set Budget"}
        </button>
      </div>

      {budget && !editing && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between",
                        marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#888" }}>
              {pct.toFixed(1)}% of monthly budget used
            </span>
            <span style={{ fontSize: 11, color }}>
              ${spent.toFixed(4)} / ${budget.monthly_limit}
            </span>
          </div>
          <div style={{ background: "#1e1e2e", borderRadius: 4,
                        height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: color, borderRadius: 4,
              transition: "width 0.5s"
            }} />
          </div>
          {pct >= 80 && (
            <div style={{ fontSize: 11, color, marginTop: 4 }}>
              ⚠ {pct >= 100 ? "Budget exceeded!" : "Approaching budget limit"}
            </div>
          )}
        </div>
      )}

      {editing && (
        <div style={{ display: "flex", gap: 8, alignItems: "center",
                      flexWrap: "wrap", marginTop: 8 }}>
          <input
            type="number" placeholder="Monthly limit ($)"
            value={limit} onChange={e => setLimit(e.target.value)}
            style={{ background: "#1e1e2e", border: "1px solid #444",
                     borderRadius: 6, padding: "6px 10px", color: "#fff",
                     fontSize: 12, width: 160 }}
          />
          <input
            type="email" placeholder="Alert email"
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ background: "#1e1e2e", border: "1px solid #444",
                     borderRadius: 6, padding: "6px 10px", color: "#fff",
                     fontSize: 12, width: 200 }}
          />
          <button onClick={handleSave} disabled={saving} style={{
            padding: "6px 16px", borderRadius: 6, border: "none",
            background: "#378ADD", color: "#fff", fontSize: 12,
            cursor: saving ? "not-allowed" : "pointer"
          }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export function BudgetPanel({ vms, costTotals }) {
  return (
    <div>
      <h3 style={{ color: "#fff", fontWeight: 500,
                   fontSize: 14, marginBottom: 4 }}>
        Budget management
      </h3>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        Set monthly spending limits per VM — alerts fire at 80% and 95%
      </p>
      {(vms || []).map(vm => (
        <BudgetRow
          key={vm}
          vm={vm}
          totalCost={costTotals?.[vm] || 0}
        />
      ))}
      {(!vms || vms.length === 0) && (
        <div style={{ color: "#888", fontSize: 13 }}>
          No VMs registered yet
        </div>
      )}
    </div>
  );
}
