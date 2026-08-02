const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // sends the session cookie
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  sync: () => request("/api/sync", { method: "POST" }),
  overview: () => request("/api/overview"),
  projects: () => request("/api/projects"),
  monthlyReview: {
    generate: () => request("/api/reports/monthly", { method: "POST" }),
    latest: () => request("/api/reports/monthly"),
  },
};

export const GITHUB_LOGIN_URL = `${API_BASE}/auth/github`;
