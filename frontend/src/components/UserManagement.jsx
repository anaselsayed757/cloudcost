import { useState, useCallback } from "react";
import { usePolling } from "../hooks/usePolling";

const BASE = process.env.REACT_APP_API_URL || "http://10.150.40.10:8000";
const getToken = () => localStorage.getItem("token");

export function UserManagement() {
  const [form,    setForm]    = useState({ username: "", email: "", password: "", role: "viewer" });
  const [msg,     setMsg]     = useState("");
  const [loading, setLoading] = useState(false);
  const [users,   setUsers]   = useState([]);

  const loadUsers = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/auth/users`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (r.ok) setUsers(await r.json());
    } catch {}
  }, []);

  usePolling(loadUsers, 30000);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch(`${BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(form)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed");
      setMsg({ text: `✓ User "${form.username}" created as ${form.role}`,
               color: "#00aa55" });
      setForm({ username: "", email: "", password: "", role: "viewer" });
      loadUsers();
    } catch (err) {
      setMsg({ text: `✗ ${err.message}`, color: "#ff4444" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 style={{ color: "#fff", fontWeight: 500,
                   fontSize: 14, marginBottom: 4 }}>
        User management
      </h3>
      <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
        Add team members — admin can run billing, viewer is read-only
      </p>

      {/* Register form */}
      <div style={{ background: "#1e1e2e", borderRadius: 10,
                    padding: 16, marginBottom: 16,
                    border: "1px solid #333" }}>
        <div style={{ fontSize: 12, color: "#888",
                      marginBottom: 12 }}>Add new user</div>
        <div style={{ display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 120px auto",
                      gap: 10, alignItems: "end" }}>
          {[
            { label: "Username", key: "username", type: "text",
              placeholder: "johndoe" },
            { label: "Email",    key: "email",    type: "email",
              placeholder: "john@example.com" },
            { label: "Password", key: "password", type: "password",
              placeholder: "••••••••" },
          ].map(field => (
            <div key={field.key}>
              <div style={{ fontSize: 11, color: "#666",
                            marginBottom: 4 }}>{field.label}</div>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={e => setForm({ ...form,
                  [field.key]: e.target.value })}
                style={{ width: "100%", background: "#2a2a3e",
                         border: "1px solid #444", borderRadius: 6,
                         padding: "7px 10px", color: "#fff",
                         fontSize: 12, boxSizing: "border-box" }}
              />
            </div>
          ))}

          <div>
            <div style={{ fontSize: 11, color: "#666",
                          marginBottom: 4 }}>Role</div>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{ width: "100%", background: "#2a2a3e",
                       border: "1px solid #444", borderRadius: 6,
                       padding: "7px 10px", color: "#fff",
                       fontSize: 12 }}>
              <option value="viewer">viewer</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || !form.username || !form.email || !form.password}
            style={{ padding: "7px 16px", borderRadius: 6,
                     border: "none", background: "#378ADD",
                     color: "#fff", fontSize: 12,
                     cursor: loading ? "not-allowed" : "pointer",
                     opacity: (!form.username || !form.email ||
                               !form.password) ? 0.5 : 1 }}>
            {loading ? "..." : "Add user"}
          </button>
        </div>

        {msg && (
          <div style={{ marginTop: 10, padding: "6px 12px",
                        borderRadius: 6, fontSize: 12,
                        background: `${msg.color}22`,
                        color: msg.color,
                        border: `1px solid ${msg.color}` }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Users list */}
      {users.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: "#666",
                        marginBottom: 8 }}>Registered users</div>
          {users.map(u => (
            <div key={u.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "8px 12px", borderRadius: 8,
              background: "#1e1e2e", marginBottom: 6,
              border: "1px solid #2a2a3e"
            }}>
              <span style={{ fontSize: 13, color: "#fff",
                             flex: 1 }}>
                👤 {u.username}
              </span>
              <span style={{ fontSize: 12, color: "#888" }}>
                {u.email}
              </span>
              <span style={{
                fontSize: 11, padding: "1px 8px", borderRadius: 4,
                background: u.role === "admin" ? "#378ADD22" : "#1D9E7522",
                color: u.role === "admin" ? "#378ADD" : "#1D9E75"
              }}>{u.role}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
