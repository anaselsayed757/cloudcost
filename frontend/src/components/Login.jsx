import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });
      if (!res.ok) throw new Error("Invalid username or password");
      const data = await res.json();
      localStorage.setItem("token",    data.access_token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("role",     data.role);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#13131f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "#2a2a3e", borderRadius: 16, padding: "40px 48px",
        border: "1px solid #333", width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>☁</div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 600, margin: 0 }}>
            CloudCost Monitor
          </h1>
          <p style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{
                width: "100%", padding: "10px 14px",
                background: "#1e1e2e", border: "1px solid #444",
                borderRadius: 8, color: "#fff", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", padding: "10px 14px",
                background: "#1e1e2e", border: "1px solid #444",
                borderRadius: 8, color: "#fff", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#ff444422", border: "1px solid #ff4444",
              borderRadius: 8, padding: "10px 14px",
              color: "#ff4444", fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px",
              background: loading ? "#333" : "#378ADD",
              border: "none", borderRadius: 8,
              color: "#fff", fontSize: 14, fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
