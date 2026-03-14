import { useState } from "react";
import T from "../theme/index.js";
import { fmt, fmtDate } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Badge from "../components/Badge.jsx";
import Btn from "../components/Btn.jsx";

const ComandasAbertas = ({ orders, accounts, setView, onClose, onDelete, onEdit }) => {
  const [confirmId, setConfirmId] = useState(null); // id da comanda aguardando confirmação

  const open = orders
    .filter((o) => o.status === "aberta")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const closed = orders
    .filter((o) => o.status === "fechada")
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    .slice(0, 10);

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Comandas</h2>
      <p style={{ color: T.txtM, fontSize: 14, marginBottom: 24 }}>{open.length} comanda(s) em aberto</p>

      {open.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.txtM, marginBottom: 12 }}>EM ABERTO</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {open.map((o) => (
              <div
                key={o.id}
                style={{
                  background: T.card,
                  border: `1px solid ${confirmId === o.id ? T.red + "66" : T.amber + "33"}`,
                  borderRadius: T.radius,
                  padding: 16,
                  transition: "border-color .2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Mesa {o.table}</div>
                    {o.clientName && <div style={{ fontSize: 12, color: T.txtM }}>{o.clientName}</div>}
                  </div>
                  <Badge color={T.amber}>Aberta</Badge>
                </div>
                <div style={{ fontSize: 12, color: T.txtS, marginBottom: 8 }}>
                  {fmtDate(o.createdAt)} • {o.attendantName}
                </div>
                <div style={{ fontSize: 12, color: T.txtM, marginBottom: 12 }}>
                  {o.items.length} item(ns) • {o.items.reduce((s, i) => s + i.qty, 0)} unidades
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>{fmt(o.total)}</span>
                  <button
                    onClick={() => onEdit(o)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: T.radiusSm,
                      background: T.amber + "22", border: `1px solid ${T.amber}55`,
                      color: T.amber, fontSize: 12, fontWeight: 600,
                    }}
                  >
                    <Ic n="plus" s={13} c={T.amber} /> Adicionar Itens
                  </button>
                </div>

                <div style={{ fontSize: 11, color: T.txtM, fontWeight: 600, marginBottom: 6 }}>FECHAR COM:</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => onClose(o.id, acc.id)}
                      style={{
                        flex: 1, padding: "8px 4px", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 600,
                        background: acc.color + "22", color: acc.color, border: `1px solid ${acc.color}55`, textAlign: "center",
                      }}
                    >
                      {acc.icon}
                    </button>
                  ))}
                </div>

                {/* Cancelar: primeiro clique pede confirmação, segundo confirma */}
                {confirmId !== o.id ? (
                  <button
                    onClick={() => setConfirmId(o.id)}
                    style={{
                      width: "100%", padding: "6px 0", background: "transparent",
                      color: T.red, border: `1px solid ${T.red}33`, borderRadius: T.radiusSm, fontSize: 12,
                    }}
                  >
                    Cancelar comanda
                  </button>
                ) : (
                  <div style={{
                    background: T.red + "11", border: `1px solid ${T.red}44`,
                    borderRadius: T.radiusSm, padding: "10px 12px",
                  }}>
                    <p style={{ fontSize: 12, color: T.red, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>
                      Cancelar comanda da Mesa {o.table}?
                    </p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => { onDelete(o.id); setConfirmId(null); }}
                        style={{
                          flex: 1, padding: "7px 0", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 700,
                          background: T.redDim, color: "#fff", border: "none",
                        }}
                      >
                        Sim, cancelar
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        style={{
                          flex: 1, padding: "7px 0", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 600,
                          background: T.card, color: T.txtM, border: `1px solid ${T.bdr}`,
                        }}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {open.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: T.txtM }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <p>Nenhuma comanda em aberto!</p>
          <Btn onClick={() => setView("comanda")} style={{ marginTop: 16, display: "inline-flex" }}>
            <Ic n="plus" s={16} c="#1a0e00" /> Nova Comanda
          </Btn>
        </div>
      )}

      {closed.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.txtM, marginBottom: 12 }}>FECHADAS RECENTES</h3>
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, overflow: "hidden" }}>
            {closed.map((o, i) => {
              const acc = accounts.find((a) => a.id === o.accountId);
              return (
                <div
                  key={o.id}
                  style={{
                    display: "flex", alignItems: "center", padding: "12px 16px",
                    borderBottom: i < closed.length - 1 ? `1px solid ${T.bdr}` : "none",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      Mesa {o.table} {o.clientName && `— ${o.clientName}`}
                    </div>
                    <div style={{ fontSize: 11, color: T.txtS }}>
                      {fmtDate(o.closedAt || o.createdAt)} • {o.attendantName}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: acc?.color || T.grn }}>{fmt(o.total)}</div>
                    <div style={{ fontSize: 11, color: T.txtM }}>{acc?.name || "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ComandasAbertas;
