import { useState } from "react";
import T from "../theme/index.js";
import { fmt, fmtDate } from "../lib/helpers.js";
import Btn from "../components/Btn.jsx";

const Historico = ({ orders, accounts }) => {
  const [filterAcc, setFilterAcc] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const closed = orders
    .filter((o) => o.status === "fechada")
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));

  const filtered = closed.filter(
    (o) =>
      (filterAcc === "all" || o.accountId === filterAcc ||
        (o.payments || []).some(p => p.accountId === filterAcc)) &&
      (!filterDate ||
        new Date(o.closedAt).toLocaleDateString("pt-BR") ===
          new Date(filterDate + "T00:00:00").toLocaleDateString("pt-BR"))
  );
  const totalFiltered = filtered.reduce((s, o) => s + o.total, 0);

  const getPayments = (o) => o.payments || (o.accountId ? [{ accountId: o.accountId, amount: o.total }] : []);
  const hasDiscount = (o) => (o.discount > 0) || (o.items || []).some(i => (i.discount || 0) > 0);

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Histórico de Vendas</h2>
      <p style={{ color: T.txtM, fontSize: 14, marginBottom: 24 }}>
        {filtered.length} registro(s) • {fmt(totalFiltered)}
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={filterAcc} onChange={(e) => setFilterAcc(e.target.value)} style={{ width: "auto" }}>
          <option value="all">Todas as contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ width: "auto" }}
        />
        {(filterAcc !== "all" || filterDate) && (
          <Btn onClick={() => { setFilterAcc("all"); setFilterDate(""); }} variant="ghost" size="sm">
            Limpar
          </Btn>
        )}
      </div>

      <div
        style={{
          background: T.card,
          border: `1px solid ${T.bdr}`,
          borderRadius: T.radius,
          overflow: "hidden",
        }}
      >
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: T.txtM }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            <p>Nenhum registro encontrado</p>
          </div>
        )}
        {filtered.map((o, i) => {
          const payments = getPayments(o);
          const isSplit = payments.length > 1;
          const firstAcc = accounts.find((a) => a.id === payments[0]?.accountId);
          const hasObs = (o.items || []).some(it => it.obs);
          return (
            <div
              key={o.id}
              style={{
                padding: "14px 18px",
                borderBottom: i < filtered.length - 1 ? `1px solid ${T.bdr}` : "none",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: (isSplit ? T.blue : firstAcc?.color || T.amber) + "22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {isSplit ? "➗" : firstAcc?.icon || "💳"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  Mesa {o.table} {o.clientName && `— ${o.clientName}`}
                </div>
                <div style={{ fontSize: 12, color: T.txtM, marginTop: 2 }}>
                  {fmtDate(o.closedAt || o.createdAt)} • Atendente: {o.attendantName}
                </div>
                <div style={{ fontSize: 11, color: T.txtS, marginTop: 2 }}>
                  {o.items.map((it) => {
                    let label = `${it.qty}x ${it.name}`;
                    if ((it.discount || 0) > 0) label += ` (−${it.discount}%)`;
                    return label;
                  }).join(", ")}
                </div>
                {(hasDiscount(o) || hasObs) && (
                  <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                    {hasDiscount(o) && (
                      <span style={{ fontSize: 10, color: T.pur }}>
                        {o.discount > 0 ? `Desc. ${o.discount}%` : "Desc. itens"}
                        {o.subtotal > 0 && ` (de ${fmt(o.subtotal)})`}
                      </span>
                    )}
                    {hasObs && <span style={{ fontSize: 10, color: T.amber }}>📝 obs.</span>}
                  </div>
                )}
                {isSplit && (
                  <div style={{ fontSize: 10, color: T.blue, marginTop: 3 }}>
                    Dividido: {payments.map(p => {
                      const a = accounts.find(ac => ac.id === p.accountId);
                      return `${a?.icon || "💳"} ${fmt(p.amount)}`;
                    }).join(" • ")}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: firstAcc?.color || T.grn }}>
                  {fmt(o.total)}
                </div>
                {isSplit ? (
                  <div style={{ fontSize: 11, color: T.blue }}>Dividido</div>
                ) : (
                  <div style={{ fontSize: 11, color: T.txtM }}>{firstAcc?.name || "—"}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Historico;
