import T from "../theme/index.js";
import { fmt, fmtDate } from "../lib/helpers.js";

const Dashboard = ({ orders, accounts, purchases, user, setView }) => {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => o.status === "fechada" && new Date(o.closedAt).toDateString() === today
  );
  const totalHoje = todayOrders.reduce((s, o) => s + o.total, 0);
  const openCount = orders.filter((o) => o.status === "aberta").length;
  const byAccount = todayOrders.reduce((a, o) => {
    a[o.accountId] = (a[o.accountId] || 0) + o.total;
    return a;
  }, {});

  const calcAccBal = (acc) =>
    (acc.initialBalance || 0) +
    orders.filter((o) => o.status === "fechada" && o.accountId === acc.id).reduce((s, o) => s + o.total, 0) -
    purchases.filter((p) => p.accountId === acc.id).reduce((s, p) => s + p.amount, 0);
  const saldoTotal = accounts.reduce((s, a) => s + calcAccBal(a), 0);

  const recentClosed = orders
    .filter((o) => o.status === "fechada")
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    .slice(0, 5);

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.txt }}>
          Bom dia, {user.name.split(" ")[0]}! 👋
        </h2>
        <p style={{ color: T.txtM, fontSize: 14, marginTop: 4 }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Saldo Total (Caixas)", value: fmt(saldoTotal), color: saldoTotal >= 0 ? T.grn : T.red, icon: "🏦" },
          { label: "Vendas Hoje",          value: fmt(totalHoje),  color: T.amber, icon: "💰" },
          { label: "Comandas Abertas",     value: openCount,       color: T.pur,   icon: "📋" },
          {
            label: "Ticket Médio",
            value: fmt(todayOrders.length > 0 ? totalHoje / todayOrders.length : 0),
            color: T.blue,
            icon: "📊",
          },
        ].map((c) => (
          <div
            key={c.label}
            style={{
              background: T.card,
              border: `1px solid ${T.bdr}`,
              borderRadius: T.radius,
              padding: 18,
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: T.txtM, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        {/* Vendas por conta */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.bdr}`,
            borderRadius: T.radius,
            padding: 20,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.txtM, marginBottom: 16 }}>
            VENDAS POR FORMA DE PAGAMENTO
          </h3>
          {accounts.map((acc) => {
            const val = byAccount[acc.id] || 0;
            const pct = totalHoje > 0 ? (val / totalHoje) * 100 : 0;
            return (
              <div key={acc.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13 }}>
                    {acc.icon} {acc.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: acc.color }}>{fmt(val)}</span>
                </div>
                <div style={{ height: 5, background: T.sur, borderRadius: 3 }}>
                  <div
                    style={{
                      height: "100%",
                      background: acc.color,
                      borderRadius: 3,
                      width: `${pct}%`,
                      transition: "width .4s",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {todayOrders.length === 0 && (
            <p style={{ color: T.txtS, fontSize: 13, textAlign: "center", padding: "16px 0" }}>
              Sem vendas hoje ainda
            </p>
          )}
        </div>

        {/* Saldo por conta */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.bdr}`,
            borderRadius: T.radius,
            padding: 20,
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.txtM, marginBottom: 16 }}>
            SALDO POR CONTA
          </h3>
          {accounts.map((acc) => {
            const bal = calcAccBal(acc);
            return (
              <div
                key={acc.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13 }}>
                  {acc.icon} {acc.name}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: bal >= 0 ? acc.color : T.red,
                  }}
                >
                  {fmt(bal)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Últimos pedidos */}
      {recentClosed.length > 0 && (
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.bdr}`,
            borderRadius: T.radius,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              borderBottom: `1px solid ${T.bdr}`,
            }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.txtM }}>ÚLTIMAS VENDAS</h3>
            <button
              onClick={() => setView("historico")}
              style={{ background: "none", color: T.amber, fontSize: 12, fontWeight: 600 }}
            >
              Ver tudo →
            </button>
          </div>
          {recentClosed.map((o, i) => {
            const acc = accounts.find((a) => a.id === o.accountId);
            return (
              <div
                key={o.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderBottom: i < recentClosed.length - 1 ? `1px solid ${T.bdr}` : "none",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: (acc?.color || T.amber) + "22",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {acc?.icon || "💳"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    Mesa {o.table} {o.clientName && `— ${o.clientName}`}
                  </div>
                  <div style={{ fontSize: 11, color: T.txtS }}>
                    {fmtDate(o.closedAt || o.createdAt)} • {o.attendantName}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: acc?.color || T.grn }}>
                    {fmt(o.total)}
                  </div>
                  <div style={{ fontSize: 11, color: T.txtM }}>{acc?.name || "—"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
