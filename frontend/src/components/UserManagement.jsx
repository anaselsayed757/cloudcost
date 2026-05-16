import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";
import { api } from "../api/client";

export function UserManagement({ theme }) {
  const [form,    setForm]    = useState({ username: "", email: "", password: "", role: "viewer" });
  const [msg,     setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(() => api.getUsers(), []);
  const { data: users = [], refresh } = usePolling(loadUsers, 30000);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const data = await api.addUser(form);
      setMsg({ text: `✓ User "${data.username}" created as ${data.role}`, color: "#00aa55" });
      setForm({ username: "", email: "", password: "", role: "viewer" });
      refresh();
    } catch (err) {
      setMsg({ text: `✗ ${err.message}`, color: "#ff4444" });
    } finally {
      setLoading(false);
    }
  };

  const t = theme || {};
  const surface  = t.surface  || "#2a2a3e";
  const surface2 = t.surface2 || "#1e1e2e";
  const border   = t.border   || "#333";
  const text     = t.text     || "#fff";
  const textSub  = t.textSub  || "#888";

  return (
    <div>
      <h3 style={{ color: text, fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
        User management
      </h3>
      <p style={{ fontSize: 12, color: textSub, marginBottom: 16 }}>
        Add team members — admin can run billing, viewer is read-only
      </p>

      <div style={{ background: surface2, borderRadius: 10, padding: 16,
                    marginBottom: 16, border: `1px solid ${border}` }}>
        <div style={{ fontSize: 12, color: textSub, marginBottom: 12 }}>Add new user</div>
        <div style={{ display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 120px auto",
                      gap: 10, alignItems: "end" }}>
          {[
            { label: "Username", key: "username", type: "text",     placeholder: "johndoe" },
            { label: "Email",    key: "email",    type: "email",    placeholder: "john@example.com" },
            { label: "Password", key: "password", type: "password", placeholder: "••••••••" },
          ].map(field => (
            <div key={field.key}>
              <div style={{ fontSize: 11, color: textSub, marginBottom: 4 }}>{field.label}</div>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                style={{
                  width: "100%", background: surface,
                  border: `1px solid ${border}`, borderRadius: 6,
                  padding: "7px 10px", color: text,
                  fontSize: 12, boxSizing: "border-box",
                }}
              />
            </div>
          ))}

          <div>
            <div style={{ fontSize: 11, color: textSub, marginBottom: 4 }}>Role</div>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{
                width: "100%", background: surface,
                border: `1px solid ${border}`, borderRadius: 6,
                padding: "7px 10px", color: text, fontSize: 12,
              }}
            >
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || !form.username || !form.email || !form.password}
            style={{
              padding: "7px 16px", borderRadius: 6,
              border: "none", background: "#378ADD",
              color: "#fff", fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: (!form.username || !form.email || !form.password) ? 0.5 : 1,
            }}
          >
            {loading ? "…" : "Add user"}
          </button>
        </div>

        {msg && (
          <div style={{
            marginTop: 10, padding: "6px 12px", borderRadius: 6,
            fontSize: 12, background: `${msg.color}22`,
            color: msg.color, border: `1px solid ${msg.color}`,
          }}>
            {msg.text}
          </div>
        )}
      </div>

      {users.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: textSub, marginBottom: 8 }}>Registered users</div>
          {users.map(u => (
            <div key={u.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "8px 12px", borderRadius: 8,
              background: surface2, marginBottom: 6,
              border: `1px solid ${border}`,
            }}>
              <span style={{ fontSize: 13, color: text, flex: 1 }}>👤 {u.username}</span>
              <span style={{ fontSize: 12, color: textSub }}>{u.email}</span>
              <span style={{
                fontSize: 11, padding: "1px 8px", borderRadius: 4,
                background: u.role === "admin" ? "#378ADD22" : "#1D9E7522",
                color:      u.role === "admin" ? "#378ADD"   : "#1D9E75",
              }}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
