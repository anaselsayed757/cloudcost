const BASE = import.meta.env.VITE_API_URL || "/api";

const getToken = () => localStorage.getItem("token");

const get = (path) =>
  fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then((r) => {
    if (r.status === 401) { localStorage.clear(); window.location.reload(); }
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });

const post = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then((r) => {
    if (r.status === 401) { localStorage.clear(); window.location.reload(); }
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });

const put = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }).then((r) => {
    if (r.status === 401) { localStorage.clear(); window.location.reload(); }
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });

const del = (path) =>
  fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then((r) => {
    if (r.status === 401) { localStorage.clear(); window.location.reload(); }
    if (!r.ok) throw new Error(`API error ${r.status}`);
    return r.json();
  });

export const api = {
  getAlertSummary:     ()                => get("/alerts/summary"),
  getAlerts:           (status)          => get(`/alerts/?status=${status}`),
  acknowledgeAlert:    (id)              => post(`/alerts/${id}/acknowledge`),
  resolveAlert:        (id)              => post(`/alerts/${id}/resolve`),
  clearResolvedAlerts: ()                => del("/alerts/resolved"),
  clearAllAlerts:      ()                => del("/alerts/all"),
  getAllVms:            ()                => get("/vms/"),
  getVmCost:           (inst, d)         => get(`/vms/${encodeURIComponent(inst)}/cost?days=${d}`),
  getForecast:         (inst)            => get(`/forecast/${encodeURIComponent(inst)}`),
  getLiveMetrics:      ()                => get("/metrics-live/"),
  runBilling:          ()                => post("/billing/run"),
  seedData:            ()                => post("/vms/seed"),
  checkAlerts:         ()                => post("/alerts/check"),
  getBillingTariffs:   ()                => get("/billing/tariffs"),
  updateTariff:        (id, body)        => put(`/billing/tariffs/${id}`, body),
  sendReceipt:         (clientEmail, days = 30, recipientEmail = null) =>
    post("/billing/receipt", {
      client_email:    clientEmail,
      recipient_email: recipientEmail,
      days,
    }),
  getMe:     ()               => get("/auth/me"),
  getUsers:  ()               => get("/auth/users"),
  addUser:   (body)           => post("/auth/register", body),
  getBudget: (inst)           => get(`/vms/${encodeURIComponent(inst)}/budget`),
  setBudget: (inst, limit, email) =>
    post(`/vms/${encodeURIComponent(inst)}/budget?limit=${limit}&email=${encodeURIComponent(email)}`),
  updateVmLabel: (inst, label) =>
    put(`/vms/${encodeURIComponent(inst)}/label?label=${encodeURIComponent(label)}`),
  exportCsvUrl: () => `${BASE}/billing/export`,
};
