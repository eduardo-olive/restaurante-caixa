import { useState } from "react";
import T from "../theme/index.js";
import { uid, fmt } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Btn from "../components/Btn.jsx";
import Modal from "../components/Modal.jsx";

const Contas = ({ accounts, orders, purchases, isAdmin, onAddAccount, onDeleteAccount, onUpdateInitialBalance }) => {
  const [showNew, setShowNew] = useState(false);
  const [showEditBal, setShowEditBal] = useState(null);
  const [newBal, setNewBal] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#f59e0b");
  const [initBal, setInitBal] = useState("0");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const getPayments = (o) => o.payments || (o.accountId ? [{ accountId: o.accountId, amount: o.total }] : []);
  const calcSales     = (accId) => orders.filter((o) => o.status === "fechada").reduce((s, o) => {
    return s + getPayments(o).filter(p => p.accountId === accId).reduce((ps, p) => ps + p.amount, 0);
  }, 0);
  const calcPurchases = (accId) => purchases.filter((p) => p.accountId === accId).reduce((s, p) => s + p.amount, 0);
  const calcBalance   = (acc)   => (acc.initialBalance || 0) + calcSales(acc.id) - calcPurchases(acc.id);
  const totalGeral    = accounts.reduce((s, a) => s + calcBalance(a), 0);

  const save = () => {
    if (!name) return;
    onAddAccount({ id: uid(), name, color, icon: "💳", type: "custom", initialBalance: parseFloat(initBal) || 0 });
    setName(""); setShowNew(false); setInitBal("0");
  };

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Contas</h2>
          <p style={{ color: T.txtM, fontSize: 14, marginTop: 4 }}>
            Saldo total disponível:{" "}
            <strong style={{ color: T.amber }}>{fmt(totalGeral)}</strong>
          </p>
        </div>
        {isAdmin && (
          <Btn onClick={() => setShowNew(true)}>
            <Ic n="plus" s={16} c="#1a0e00" /> Nova Conta
          </Btn>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 14,
          marginBottom: 28,
        }}
      >
        {accounts.map((acc) => {
          const bal   = calcBalance(acc);
          const sales = calcSales(acc.id);
          const spent = calcPurchases(acc.id);
          const initB = acc.initialBalance || 0;
          return (
            <div
              key={acc.id}
              style={{
                background: T.card,
                border: `1px solid ${acc.color}44`,
                borderRadius: T.radius,
                padding: 20,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 28 }}>{acc.icon}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {isAdmin && (
                    <button
                      onClick={() => { setShowEditBal(acc); setNewBal(String(acc.initialBalance || 0)); }}
                      style={{ background: "none", color: T.txtM, padding: 3 }}
                      title="Editar saldo inicial"
                    >
                      <Ic n="edit" s={14} c={T.txtM} />
                    </button>
                  )}
                  {isAdmin && accounts.length > 1 && (
                    confirmDeleteId === acc.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => { onDeleteAccount(acc.id); setConfirmDeleteId(null); }}
                          style={{ padding: "3px 8px", borderRadius: T.radiusSm, background: T.redDim, color: "#fff", fontSize: 10, fontWeight: 700 }}>
                          Sim
                        </button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          style={{ padding: "3px 8px", borderRadius: T.radiusSm, background: T.card, color: T.txtM, border: `1px solid ${T.bdr}`, fontSize: 10 }}>
                          Não
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(acc.id)} style={{ background: "none", color: T.red, padding: 3 }}>
                        <Ic n="trash" s={14} c={T.red} />
                      </button>
                    )
                  )}
                </div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 10, marginBottom: 2 }}>{acc.name}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: bal >= 0 ? acc.color : T.red, marginBottom: 12 }}>
                {fmt(bal)}
              </div>
              <div style={{ borderTop: `1px solid ${T.bdr}`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "Saldo inicial",      value: fmt(initB),  color: T.txt },
                  { label: "+ Vendas recebidas", value: fmt(sales),  color: T.grn },
                  { label: "− Compras pagas",    value: fmt(spent),  color: T.red },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: T.txtM }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {purchases.filter((p) => p.accountId === acc.id).length > 0 && (
                <div style={{ marginTop: 10, borderTop: `1px solid ${T.bdr}`, paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: T.txtS, fontWeight: 600, marginBottom: 6 }}>ÚLTIMAS SAÍDAS</div>
                  {purchases
                    .filter((p) => p.accountId === acc.id)
                    .slice(-3)
                    .reverse()
                    .map((p) => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                        <span style={{ color: T.txtM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                          {p.description}
                        </span>
                        <span style={{ color: T.red, fontWeight: 600, marginLeft: 8 }}>−{fmt(p.amount)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal editar saldo inicial */}
      {showEditBal && (
        <Modal title={`Saldo Inicial — ${showEditBal.name}`} onClose={() => setShowEditBal(null)} width={380}>
          <p style={{ fontSize: 13, color: T.txtM, marginBottom: 16 }}>
            Defina o valor já existente nesta conta antes de começar a usar o sistema.
          </p>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 6 }}>SALDO INICIAL (R$)</label>
            <input type="number" step="0.01" min="0" value={newBal} onChange={(e) => setNewBal(e.target.value)} placeholder="0,00" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => { onUpdateInitialBalance(showEditBal.id, parseFloat(newBal) || 0); setShowEditBal(null); }} full>Salvar</Btn>
            <Btn onClick={() => setShowEditBal(null)} variant="ghost" full>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal nova conta */}
      {showNew && (
        <Modal title="Nova Conta" onClose={() => setShowNew(false)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 6 }}>NOME DA CONTA</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Cartão Débito" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 6 }}>SALDO INICIAL (R$)</label>
            <input type="number" step="0.01" min="0" value={initBal} onChange={(e) => setInitBal(e.target.value)} placeholder="0,00" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 6 }}>COR</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["#f59e0b", "#4ade80", "#60a5fa", "#f87171", "#c084fc", "#fb923c", "#34d399", "#e879f9"].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: c, border: color === c ? "3px solid #fff" : "none" }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={save} full>Salvar</Btn>
            <Btn onClick={() => setShowNew(false)} variant="ghost" full>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Contas;
