import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function TariffPanel() {
  const fetchTariffs = useCallback(() => api.getLiveMetrics()
    .then(() => api.getAllVms())
    .catch(() => []), []);

  const { data: tariffs, refresh } = usePolling(
    useCallback(() => fetch(
      `${process.env.REACT_APP_API_URL || "http://10.150.40.10:8000"}/billing/tariffs`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    ).then(r => r.json()), []),
    60000
  );

  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const startEdit = (tariff) => {
    setEditing(tariff.id);
    setForm({
      cpu_rate:  tariff.cpu_rate_per_core_hour,
      ram_rate:  tariff.ram_rate_per_gb_hour,
      net_rate:  tariff.network_rate_per_gb,
    });
  };

  const handleSave = async (tariffId) => {
    setSaving(true);
    try {
      await fetch(
        `${process.env.REACT_APP_API_URL || "http://10.150.40.10:8000"}/billing/tariffs/${tariffId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            cpu_rate_per_core_hour: parseFloat(form.cpu_rate),
            ram_rate_per_gb_hour:   parseFloat(form.ram_rate),
            network_rate_per_gb:    parseFloat(form.net_rate),
          })
        }
      );
      setMsg("✓ Tariff updated successfully");
      setEditing(null);
      refresh();
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg("Failed to update tariff");
    }
    setSaving(false);
  };

  return (
    <div>
      <h3 style={{ color: "#fff", fontWeight: 500,
                   fontSize: 14, marginBottom: 4 }}>
        Tariff management
      </h3>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        Edit pricing rates — changes take effect on next billing cycle
      </p>

      {msg && (
        <div style={{ padding: "8px 12px", borderRadius: 6, marginBottom: 12,
                      background: "#1e1e2e", border: "1px solid #00aa55",
                      color: "#00aa55", fontSize: 12 }}>{msg}</div>
      )}

      {(tariffs || []).map(tariff => (
        <div key={tariff.id} style={{
          background: "#1e1e2e", borderRadius: 10, padding: 16,
          marginBottom: 12, border: "1px solid #333"
        }}>
          <div style={{ display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ fontWeight: 500, color: "#fff",
                             fontSize: 13 }}>{tariff.name}</span>
              <span style={{ marginLeft: 8, fontSize: 11, padding: "1px 6px",
                             borderRadius: 4, background: "#378ADD22",
                             color: "#378ADD" }}>{tariff.id}</span>
            </div>
            <button onClick={() => editing === tariff.id
              ? setEditing(null) : startEdit(tariff)}
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5,
                       border: "1px solid #444", background: "transparent",
                       color: "#aaa", cursor: "pointer" }}>
              {editing === tariff.id ? "Cancel" : "Edit rates"}
            </button>
          </div>

          {editing === tariff.id ? (
            <div style={{ display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr auto",
                          gap: 10, alignItems: "end" }}>
              {[
                { label: "CPU rate ($/core-hr)", key: "cpu_rate" },
                { label: "RAM rate ($/GB-hr)",   key: "ram_rate" },
                { label: "Network rate ($/GB)",  key: "net_rate" },
              ].map(field => (
                <div key={field.key}>
                  <div style={{ fontSize: 11, color: "#666",
                                marginBottom: 4 }}>{field.label}</div>
                  <input
                    type="number" step="0.001"
                    value={form[field.key]}
                    onChange={e => setForm({...form,
                      [field.key]: e.target.value})}
                    style={{ width: "100%", background: "#2a2a3e",
                             border: "1px solid #444", borderRadius: 6,
                             padding: "6px 10px", color: "#fff",
                             fontSize: 12, boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <button onClick={() => handleSave(tariff.id)}
                disabled={saving}
                style={{ padding: "6px 16px", borderRadius: 6,
                         border: "none", background: "#378ADD",
                         color: "#fff", fontSize: 12,
                         cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "..." : "Save"}
              </button>
            </div>
          ) : (
            <div style={{ display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 10 }}>
              {[
                { label: "CPU",     value: `$${tariff.cpu_rate_per_core_hour}/core-hr` },
                { label: "RAM",     value: `$${tariff.ram_rate_per_gb_hour}/GB-hr`     },
                { label: "Network", value: `$${tariff.network_rate_per_gb}/GB`         },
              ].map(item => (
                <div key={item.label} style={{
                  background: "#2a2a3e", borderRadius: 6,
                  padding: "8px 12px"
                }}>
                  <div style={{ fontSize: 11, color: "#666" }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500,
                                color: "#aaa", marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
