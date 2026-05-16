import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function VmLabels({ theme }) {
  const fetchVms = useCallback(() => api.getAllVms(), []);
  const { data: vms, refresh } = usePolling(fetchVms, 60000);

  const [editing, setEditing] = useState(null);
  const [label,   setLabel]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState("");

  const t        = theme || {};
  const surface2 = t.surface2 || "#1e1e2e";
  const surface  = t.surface  || "#2a2a3e";
  const border   = t.border   || "#2a2a3e";
  const text     = t.text     || "#fff";
  const textSub  = t.textSub  || "#666";

  const handleSave = async (instance) => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      await api.updateVmLabel(instance, label.trim());
      setMsg({ text: "✓ Label updated", color: "#00aa55" });
      setEditing(null);
      refresh();
      setTimeout(() => setMsg(""), 3000);
    } catch {
      setMsg({ text: "Failed to update label", color: "#ff4444" });
    }
    setSaving(false);
  };

  return (
    <div>
      <h3 style={{ color: text, fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
        VM labels
      </h3>
      <p style={{ fontSize: 12, color: textSub, marginBottom: 12 }}>
        Give your VMs human-readable names for easier identification
      </p>

      {msg && (
        <div style={{
          padding: "6px 12px", borderRadius: 6, marginBottom: 12,
          fontSize: 12, background: `${msg.color}22`,
          color: msg.color, border: `1px solid ${msg.color}`,
        }}>
          {msg.text}
        </div>
      )}

      {(vms || []).map(vm => (
        <div key={vm.instance} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", borderRadius: 8,
          background: surface2, marginBottom: 8,
          border: `1px solid ${border}`,
        }}>
          <code style={{ fontSize: 11, color: "#378ADD", flex: 1 }}>
            {vm.instance}
          </code>

          {editing === vm.instance ? (
            <>
              <input
                autoFocus
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave(vm.instance)}
                placeholder="e.g. Web Server"
                style={{
                  background: surface, border: `1px solid ${border}`,
                  borderRadius: 6, padding: "5px 10px",
                  color: text, fontSize: 12, width: 160,
                }}
              />
              <button
                onClick={() => handleSave(vm.instance)}
                disabled={saving}
                style={{
                  padding: "5px 12px", borderRadius: 6,
                  border: "none", background: "#378ADD",
                  color: "#fff", fontSize: 11, cursor: "pointer",
                }}
              >
                {saving ? "…" : "Save"}
              </button>
              <button
                onClick={() => setEditing(null)}
                style={{
                  padding: "5px 12px", borderRadius: 6,
                  border: `1px solid ${border}`, background: "transparent",
                  color: textSub, fontSize: 11, cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: 13, color: text, flex: 1 }}>
                {vm.label && vm.label !== vm.instance
                  ? vm.label
                  : <span style={{ color: "#555", fontStyle: "italic" }}>no label</span>}
              </span>
              <button
                onClick={() => { setEditing(vm.instance); setLabel(vm.label || ""); }}
                style={{
                  padding: "4px 10px", borderRadius: 5,
                  border: `1px solid ${border}`, background: "transparent",
                  color: textSub, fontSize: 11, cursor: "pointer",
                }}
              >
                Edit
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
