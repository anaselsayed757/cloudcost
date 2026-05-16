import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function TariffPanel({ theme }) {
  const fetchTariffs = useCallback(() => api.getBillingTariffs(), []);
  const { data: tariffs, refresh } = usePolling(fetchTariffs, 60000);

  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const t       = theme || {};
  const surface  = t.surface  || "#2a2a3e";
  const surface2 = t.surface2 || "#1e1e2e";
  const border   = t.border   || "#333";
  const text     = t.text     || "#fff";
  const textSub  = t.textSub  || "#666";

  const startEdit = (tariff) => {
    setEditing(tariff.id);
    setForm({
      cpu_rate: tariff.cpu_rate_per_core_hour,
      ram_rate: tariff.ram_rate_per_gb_hour,
      net_rate: tariff.network_rate_per_gb,
    });
  };

  const handleSave = async (tariffId) => {
    setSaving(true);
    try {
      await api.updateTariff(tariffId, {
        cpu_rate_per_core_hour: parseFloat(form.cpu_rate),
        ram_rate_per_gb_hour:   parseFloat(form.ram_rate),
        network_rate_per_gb:    parseFloat(form.net_rate),
      });
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
      <h3 style={{ color: text, fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
        Tariff management
      </h3>
      <p style={{ fontSize: 12, color: textSub, marginBottom: 12 }}>
        Edit pricing rates — changes take effect on next billing cycle
      </p>

      {msg && (
        <div style={{
          padding: "8px 12px", borderRadius: 6, marginBottom: 12,
          background: surface2, border: "1px solid #00aa55",
          color: "#00aa55", fontSize: 12,
        }}>{msg}</div>
      )}

      {(tariffs || []).map(tariff => (
        <div key={tariff.id} style={{
          background: surface2, borderRadius: 10, padding: 16,
          marginBottom: 12, border: `1px solid ${border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <span style={{ fontWeight: 500, color: text, fontSize: 13 }}>
                {tariff.name}
              </span>
              <span style={{ marginLeft: 8, fontSize: 11, padding: "1px 6px",
                             borderRadius: 4, background: "#378ADD22",
                             color: "#378ADD" }}>
                {tariff.id}
              </span>
            </div>
            <button
              onClick={() => editing === tariff.id ? setEditing(null) : startEdit(tariff)}
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5,
                       border: `1px solid ${border}`, background: "transparent",
                       color: textSub, cursor: "pointer" }}
            >
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
                  <div style={{ fontSize: 11, color: textSub, marginBottom: 4 }}>
                    {field.label}
                  </div>
                  <input
                    type="number"
                    step="0.001"
                    value={form[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                    style={{
                      width: "100%", background: surface,
                      border: `1px solid ${border}`, borderRadius: 6,
                      padding: "6px 10px", color: text,
                      fontSize: 12, boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <button
                onClick={() => handleSave(tariff.id)}
                disabled={saving}
                style={{
                  padding: "6px 16px", borderRadius: 6,
                  border: "none", background: "#378ADD",
                  color: "#fff", fontSize: 12,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "…" : "Save"}
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "CPU",     value: `$${tariff.cpu_rate_per_core_hour}/core-hr` },
                { label: "RAM",     value: `$${tariff.ram_rate_per_gb_hour}/GB-hr`     },
                { label: "Network", value: `$${tariff.network_rate_per_gb}/GB`         },
              ].map(item => (
                <div key={item.label} style={{
                  background: surface, borderRadius: 6, padding: "8px 12px",
                }}>
                  <div style={{ fontSize: 11, color: textSub }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 500,
                                color: textSub, marginTop: 2 }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
