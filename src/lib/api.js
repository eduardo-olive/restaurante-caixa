// ─── API Client ───────────────────────────────────────────────────────────────
// Substitui window.storage por chamadas REST ao backend.
// Troca BASE_URL pelo endereço da sua API em produção.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

let _token = localStorage.getItem("rc_token") || null;

function setToken(t) {
  _token = t;
  if (t) localStorage.setItem("rc_token", t);
  else localStorage.removeItem("rc_token");
}

function getToken() { return _token; }

async function req(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...((_token) ? { Authorization: `Bearer ${_token}` } : {}),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (res.status === 401) {
    // Token expirado — força logout
    setToken(null);
    window.location.reload();
    throw new Error("Sessão expirada");
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na requisição");
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
const auth = {
  async login(username, password) {
    const data = await req("POST", "/auth/login", { username, password });
    setToken(data.token);
    return data.user;
  },
  logout() { setToken(null); },
  getToken,
  isLoggedIn() { return !!_token; },
};

// ── Users ──────────────────────────────────────────────────────────────────────
const users = {
  list:   ()          => req("GET",    "/users"),
  create: (u)         => req("POST",   "/users", u),
  update: (id, u)     => req("PUT",    `/users/${id}`, u),
  toggle: (id)        => req("PATCH",  `/users/${id}/toggle`),
};

// ── Accounts ──────────────────────────────────────────────────────────────────
const accounts = {
  list:           ()          => req("GET",    "/accounts"),
  create:         (a)         => req("POST",   "/accounts", a),
  update:         (id, a)     => req("PUT",    `/accounts/${id}`, a),
  updateBalance:  (id, bal)   => req("PATCH",  `/accounts/${id}/balance`, { initialBalance: bal }),
  remove:         (id)        => req("DELETE", `/accounts/${id}`),
};

// ── Products ──────────────────────────────────────────────────────────────────
const products = {
  list:   ()          => req("GET",    "/products"),
  create: (p)         => req("POST",   "/products", p),
  update: (id, p)     => req("PUT",    `/products/${id}`, p),
  remove: (id)        => req("DELETE", `/products/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
const orders = {
  list:   ()              => req("GET",    "/orders"),
  create: (o)             => req("POST",   "/orders", o),
  update: (id, o)         => req("PUT",    `/orders/${id}`, o),
  close:  (id, accountId) => req("PATCH",  `/orders/${id}/close`, { accountId }),
  remove: (id)            => req("DELETE", `/orders/${id}`),
};

// ── Stock ──────────────────────────────────────────────────────────────────────
const stock = {
  list:   ()              => req("GET",    "/stock"),
  create: (s)             => req("POST",   "/stock", s),
  update: (id, s)         => req("PUT",    `/stock/${id}`, s),
  adjust: (id, delta, type, newQty) =>
    req("PATCH", `/stock/${id}/adjust`, { delta, type, newQty }),
  remove: (id)            => req("DELETE", `/stock/${id}`),
};

// ── Purchases ─────────────────────────────────────────────────────────────────
const purchases = {
  list:   () => req("GET",  "/purchases"),
  create: (p) => req("POST", "/purchases", p),
};

// ── Shopping ──────────────────────────────────────────────────────────────────
const shopping = {
  list:   () => req("GET",    "/shopping"),
  create: (s) => req("POST",  "/shopping", s),
  remove: (id) => req("DELETE", `/shopping/${id}`),
};

export { auth, users, accounts, products, orders, stock, purchases, shopping };
