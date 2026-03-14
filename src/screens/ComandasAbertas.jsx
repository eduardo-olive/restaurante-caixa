import { useState } from "react";
import T from "../theme/index.js";
import { fmt, fmtDate } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Badge from "../components/Badge.jsx";
import Btn from "../components/Btn.jsx";

const ComandasAbertas = ({ orders, accounts, setView, onClose, onDelete, onEdit }) => {
  const [confirmId, setConfirmId] = useState(null);
  const [splitId, setSplitId]     = useState(null);
  const [splitAmounts, setSplitAmounts] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const open = orders
    .filter((o) => o.status === "aberta")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const closed = orders
    .filter((o) => o.status === "fechada")
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    .slice(0, 10);

  // Split helpers
  const splitTotal = Object.values(splitAmounts).reduce((s, v) => s + (v || 0), 0);
  const splitOrderTotal = splitId ? (open.find(o => o.id === splitId)?.total || 0) : 0;
  const splitRemaining = Math.round((splitOrderTotal - splitTotal) * 100) / 100;
  const splitValid = Math.abs(splitRemaining) < 0.01 && Object.values(splitAmounts).some(v => v > 0);

  const handleSplitEqual = (orderTotal) => {
    const n = accounts.length;
    if (n === 0) return;
    const each = Math.floor(orderTotal / n * 100) / 100;
    const amounts = {};
    accounts.forEach((a, i) => {
      amounts[a.id] = i === n - 1 ? Math.round((orderTotal - each * (n - 1)) * 100) / 100 : each;
    });
    setSplitAmounts(amounts);
  };

  const handleCloseSplit = (orderId) => {
    const payments = Object.entries(splitAmounts)
      .filter(([, amount]) => amount > 0)
      .map(([accountId, amount]) => ({ accountId, amount: Math.round(amount * 100) / 100 }));
    if (payments.length === 0 || !splitValid) return;
    onClose(orderId, payments[0].accountId, payments);
    setSplitId(null);
    setSplitAmounts({});
  };

  const hasDiscount = (o) => (o.discount > 0) || o.items.some(i => (i.discount || 0) > 0);
  const getPayments = (o) => o.payments || (o.accountId ? [{ accountId: o.accountId, amount: o.total }] : []);

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
              gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {open.map((o) => (
              <div
                key={o.id}
                style={{
                  background: T.card,
                  border: `1px solid ${confirmId === o.id ? T.red + "66" : splitId === o.id ? T.blue + "66" : T.amber + "33"}`,
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

                {/* Items summary with obs indicators */}
                <div style={{ fontSize: 12, color: T.txtM, marginBottom: 6 }}>
                  {o.items.length} item(ns) • {o.items.reduce((s, i) => s + i.qty, 0)} unidades
                  {o.items.some(i => i.obs) && (
                    <span style={{ color: T.amber, marginLeft: 6 }}>📝 com obs.</span>
                  )}
                </div>

                {/* Expandable item details */}
                <button
                  onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: 11, color: T.blue, cursor: "pointer", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {expandedId === o.id ? "▾ Ocultar itens" : "▸ Ver itens"}
                </button>

                {expandedId === o.id && (
                  <div style={{
                    background: T.sur, borderRadius: T.radiusSm, padding: 10, marginBottom: 10,
                    border: `1px solid ${T.bdr}`, maxHeight: 160, overflowY: "auto",
                  }}>
                    {o.items.map((item, idx) => (
                      <div key={idx} style={{
                        fontSize: 12, padding: "4px 0",
                        borderBottom: idx < o.items.length - 1 ? `1px solid ${T.bdr}` : "none",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>{item.qty}x {item.name}</span>
                          <span style={{ color: (item.discount || 0) > 0 ? T.pur : T.amber, fontWeight: 600 }}>
                            {fmt(item.price * item.qty * (1 - (item.discount || 0) / 100))}
                          </span>
                        </div>
                        {(item.discount || 0) > 0 && (
                          <div style={{ fontSize: 10, color: T.pur }}>−{item.discount}% desc.</div>
                        )}
                        {item.obs && (
                          <div style={{ fontSize: 11, color: T.amber, fontStyle: "italic" }}>
                            📝 {item.obs}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Discount info */}
                {hasDiscount(o) && (
                  <div style={{ fontSize: 11, color: T.pur, marginBottom: 6 }}>
                    {o.discount > 0 && <span>Desc. comanda: {o.discount}% </span>}
                    {o.items.some(i => (i.discount || 0) > 0) && <span>• Itens com desconto</span>}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    {hasDiscount(o) && o.subtotal && (
                      <div style={{ fontSize: 11, color: T.txtS, textDecoration: "line-through" }}>
                        {fmt(o.subtotal)}
                      </div>
                    )}
                    <span style={{ fontSize: 18, fontWeight: 700, color: T.amber }}>{fmt(o.total)}</span>
                  </div>
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

                {/* ── Close with single payment ── */}
                {splitId !== o.id && (
                  <>
                    <div style={{ fontSize: 11, color: T.txtM, fontWeight: 600, marginBottom: 6 }}>FECHAR COM:</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      {accounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => onClose(o.id, acc.id, [{ accountId: acc.id, amount: o.total }])}
                          style={{
                            flex: 1, padding: "8px 4px", borderRadius: T.radiusSm, fontSize: 12, fontWeight: 600,
                            background: acc.color + "22", color: acc.color, border: `1px solid ${acc.color}55`, textAlign: "center",
                          }}
                        >
                          {acc.icon}
                        </button>
                      ))}
                    </div>

                    {/* Split button */}
                    <button
                      onClick={() => { setSplitId(o.id); setSplitAmounts({}); setConfirmId(null); }}
                      style={{
                        width: "100%", padding: "6px 0", marginBottom: 8,
                        background: "transparent", color: T.blue,
                        border: `1px solid ${T.blue}33`, borderRadius: T.radiusSm,
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      ➗ Dividir Conta
                    </button>
                  </>
                )}

                {/* ── Split payment panel ── */}
                {splitId === o.id && (
                  <div style={{
                    padding: 12, borderRadius: T.radius, marginBottom: 8,
                    background: T.sur, border: `1px solid ${T.blue}44`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.blue }}>DIVIDIR CONTA</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleSplitEqual(o.total)}
                          style={{
                            padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                            background: T.blue + "22", border: `1px solid ${T.blue}44`, color: T.blue,
                          }}>
                          Igual
                        </button>
                        <button onClick={() => { setSplitId(null); setSplitAmounts({}); }}
                          style={{
                            padding: "3px 8px", borderRadius: 4, fontSize: 10,
                            background: T.card, border: `1px solid ${T.bdr}`, color: T.txtM,
                          }}>
                          ✕
                        </button>
                      </div>
                    </div>

                    {accounts.map((acc) => (
                      <div key={acc.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 14 }}>{acc.icon}</span>
                        <span style={{ fontSize: 11, color: T.txt, flex: 1 }}>{acc.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10, color: T.txtS }}>R$</span>
                          <input
                            type="number" min="0" step="0.01"
                            value={splitAmounts[acc.id] ?? ""}
                            onChange={(e) => setSplitAmounts(prev => ({
                              ...prev, [acc.id]: Number(e.target.value) || 0,
                            }))}
                            placeholder="0,00"
                            style={{
                              width: 70, fontSize: 12, padding: "5px 6px", textAlign: "right",
                              background: T.card, border: `1px solid ${T.bdr}`,
                              borderRadius: 4, color: T.txt,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "6px 0", marginTop: 4, borderTop: `1px solid ${T.bdr}`,
                    }}>
                      <span style={{ fontSize: 11, color: T.txtM }}>Restante:</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: Math.abs(splitRemaining) < 0.01 ? T.grn : T.red,
                      }}>
                        {fmt(splitRemaining)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCloseSplit(o.id)}
                      disabled={!splitValid}
                      style={{
                        width: "100%", padding: "8px 0", marginTop: 8,
                        borderRadius: T.radiusSm,
                        background: splitValid ? T.blue : T.card,
                        border: splitValid ? "none" : `1px solid ${T.bdr}`,
                        color: splitValid ? "#fff" : T.txtS,
                        fontSize: 12, fontWeight: 700,
                        opacity: splitValid ? 1 : 0.5,
                        cursor: splitValid ? "pointer" : "not-allowed",
                      }}
                    >
                      ✓ Confirmar Divisão
                    </button>
                  </div>
                )}

                {/* Cancelar: 2-step confirmation */}
                {confirmId !== o.id ? (
                  <button
                    onClick={() => { setConfirmId(o.id); setSplitId(null); }}
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
              const payments = getPayments(o);
              const isSplit = payments.length > 1;
              const firstAcc = accounts.find((a) => a.id === payments[0]?.accountId);
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
                    {hasDiscount(o) && (
                      <div style={{ fontSize: 10, color: T.pur, marginTop: 1 }}>
                        Com desconto
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: firstAcc?.color || T.grn }}>
                      {fmt(o.total)}
                    </div>
                    {isSplit ? (
                      <div style={{ fontSize: 10, color: T.blue }}>
                        Dividido • {payments.length} pagamentos
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: T.txtM }}>{firstAcc?.name || "—"}</div>
                    )}
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
