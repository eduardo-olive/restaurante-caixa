import { useState } from "react";
import T from "../theme/index.js";
import { uid, fmt, groupBy } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Btn from "../components/Btn.jsx";
import Modal from "../components/Modal.jsx";

const ListaCompras = ({ stock, extras, accounts, onSaveExtra, onDeleteExtra, onReceiveStock, onReceiveExtra }) => {
  const [showReceive, setShowReceive] = useState(null);
  const [recQty, setRecQty] = useState("");
  const [recCost, setRecCost] = useState("");
  const [recAccountId, setRecAccountId] = useState("");
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraForm, setExtraForm] = useState({ name: "", qty: "", unit: "un", cost: "", supplier: "" });
  const [filterCat, setFilterCat] = useState("Todos");

  const autoItems = stock.filter((s) => s.qty < s.minQty);
  const autoByCategory = groupBy(autoItems, (s) => s.category);
  const cats = ["Todos", ...Object.keys(autoByCategory)];
  const filteredAuto = filterCat === "Todos" ? autoItems : (autoByCategory[filterCat] || []);

  const needQty   = (s) => Math.ceil(s.minQty * 2 - s.qty);
  const totalEstAuto  = autoItems.reduce((sum, s) => sum + needQty(s) * s.cost, 0);
  const totalEstExtra = extras.reduce((sum, e) => sum + e.qty * (e.cost || 0), 0);
  const totalGeral    = totalEstAuto + totalEstExtra;

  const urgency = (s) => {
    if (s.qty === 0) return { label: "Sem estoque", color: T.red };
    const pct = s.qty / s.minQty;
    if (pct <= 0.3) return { label: "Urgente",  color: T.red };
    if (pct <= 0.7) return { label: "Crítico",  color: "#f97316" };
    return              { label: "Baixo",    color: T.amber };
  };

  const openReceive = (type, item) => {
    setShowReceive({ type, item });
    setRecQty(String(type === "stock" ? needQty(item) : item.qty));
    setRecCost(String(type === "stock" ? item.cost : (item.cost || 0)));
    setRecAccountId(accounts[0]?.id || "");
  };

  const doReceive = () => {
    if (!recQty || isNaN(recQty) || parseFloat(recQty) <= 0) return;
    if (!recAccountId) { alert("Selecione a conta de pagamento"); return; }
    const qty       = parseFloat(recQty);
    const cost      = parseFloat(recCost) || 0;
    const totalPaid = qty * cost;
    if (showReceive.type === "stock") {
      onReceiveStock(showReceive.item, qty, cost, recAccountId, totalPaid);
    } else {
      onReceiveExtra(showReceive.item, qty, cost, recAccountId, totalPaid);
    }
    setShowReceive(null); setRecQty(""); setRecCost(""); setRecAccountId("");
  };

  const addExtra = () => {
    if (!extraForm.name || !extraForm.qty) return;
    onSaveExtra({
      id: uid(), name: extraForm.name, qty: parseFloat(extraForm.qty),
      unit: extraForm.unit, cost: parseFloat(extraForm.cost) || 0,
      supplier: extraForm.supplier, createdAt: new Date().toISOString(),
    });
    setExtraForm({ name: "", qty: "", unit: "un", cost: "", supplier: "" });
    setShowAddExtra(false);
  };

  return (
    <div style={{ padding: 28 }} className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Lista de Compras</h2>
          <p style={{ color: T.txtM, fontSize: 14, marginTop: 4 }}>
            Gerada automaticamente •{" "}
            <strong style={{ color: T.amber }}>{autoItems.length}</strong> item(s) abaixo do mínimo
          </p>
        </div>
        <Btn onClick={() => setShowAddExtra(true)}>
          <Ic n="plus" s={16} c="#1a0e00" /> Item Extra
        </Btn>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Itens automáticos", value: autoItems.length,  color: autoItems.length > 0 ? T.red : T.grn, icon: "📋" },
          { label: "Itens extras",      value: extras.length,     color: T.blue,  icon: "➕" },
          { label: "Custo estimado",    value: fmt(totalGeral),   color: T.amber, icon: "💰" },
          { label: "Urgentes/Críticos", value: autoItems.filter((s) => s.qty / s.minQty <= 0.3 || s.qty === 0).length, color: T.red, icon: "🚨" },
        ].map((c) => (
          <div key={c.label} style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, padding: 16 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: T.txtM, marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Estoque OK */}
      {autoItems.length === 0 && (
        <div style={{ background: T.grnDim + "11", border: `1px solid ${T.grnDim}44`, borderRadius: T.radius, padding: 24, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
          <p style={{ fontWeight: 600, color: T.grn, fontSize: 15 }}>Estoque OK — nenhum item abaixo do mínimo!</p>
          <p style={{ color: T.txtM, fontSize: 13, marginTop: 6 }}>
            A lista será preenchida automaticamente quando algum item cair abaixo do estoque mínimo.
          </p>
        </div>
      )}

      {/* Lista automática */}
      {autoItems.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.txtM }}>
              COMPRAR — GERADO PELO SISTEMA ({autoItems.length})
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              {cats.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: filterCat === c ? T.amber : T.card,
                    color: filterCat === c ? "#1a0e00" : T.txtM,
                    border: filterCat === c ? "none" : `1px solid ${T.bdr}`,
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, overflow: "hidden", marginBottom: 28 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 90px 130px", padding: "9px 16px", borderBottom: `1px solid ${T.bdrBr}`, fontSize: 11, fontWeight: 600, color: T.txtM }}>
              <span>ITEM / FORNECEDOR</span>
              <span style={{ textAlign: "center" }}>ATUAL</span>
              <span style={{ textAlign: "center" }}>MÍNIMO</span>
              <span style={{ textAlign: "center" }}>COMPRAR</span>
              <span style={{ textAlign: "center" }}>URGÊNCIA</span>
              <span style={{ textAlign: "right" }}>CUSTO EST.</span>
            </div>

            {[...filteredAuto]
              .sort((a, b) => a.qty / a.minQty - b.qty / b.minQty)
              .map((s, i) => {
                const need = needQty(s);
                const urg  = urgency(s);
                const pct  = Math.min((s.qty / s.minQty) * 100, 100);
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: "13px 16px",
                      borderBottom: i < filteredAuto.length - 1 ? `1px solid ${T.bdr}` : "none",
                      background: s.qty === 0 ? T.red + "08" : s.qty / s.minQty <= 0.3 ? "#f9731608" : "transparent",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 90px 130px", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: T.txtM }}>
                          {s.category}{s.supplier && ` • ${s.supplier}`}
                        </div>
                        <div style={{ marginTop: 6, height: 3, background: T.sur, borderRadius: 2, width: 160 }}>
                          <div style={{ height: "100%", background: urg.color, borderRadius: 2, width: `${pct}%`, transition: "width .3s" }} />
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: urg.color }}>{s.qty}</span>
                        <span style={{ fontSize: 11, color: T.txtM }}> {s.unit}</span>
                      </div>
                      <div style={{ textAlign: "center", fontSize: 12, color: T.txtM }}>{s.minQty} {s.unit}</div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T.grn }}>{need}</span>
                        <span style={{ fontSize: 11, color: T.txtM }}> {s.unit}</span>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: urg.color, background: urg.color + "22", padding: "3px 8px", borderRadius: 20 }}>
                          {urg.label}
                        </span>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.amber }}>{fmt(need * s.cost)}</span>
                        <button
                          onClick={() => openReceive("stock", s)}
                          style={{ padding: "5px 10px", borderRadius: T.radiusSm, background: T.grnDim + "22", color: T.grn, border: `1px solid ${T.grn}44`, fontSize: 11, fontWeight: 600 }}
                        >
                          📥 Receber
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${T.bdrBr}`, background: T.sur }}>
              <span style={{ fontSize: 13, color: T.txtM, fontWeight: 600 }}>TOTAL ESTIMADO — ESTOQUE</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.amber }}>{fmt(totalEstAuto)}</span>
            </div>
          </div>
        </>
      )}

      {/* Extras manuais */}
      {extras.length > 0 && (
        <>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.txtM, marginBottom: 12 }}>ITENS EXTRAS ({extras.length})</h3>
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, overflow: "hidden", marginBottom: 24 }}>
            {extras.map((item, i) => (
              <div
                key={item.id}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < extras.length - 1 ? `1px solid ${T.bdr}` : "none" }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: T.txtM }}>
                    {item.qty} {item.unit}
                    {item.cost > 0 && <span style={{ marginLeft: 8, color: T.amber }}>{fmt(item.qty * item.cost)}</span>}
                    {item.supplier && <span style={{ marginLeft: 8, color: T.txtS }}>• {item.supplier}</span>}
                  </div>
                </div>
                <button
                  onClick={() => openReceive("extra", item)}
                  style={{ padding: "6px 12px", borderRadius: T.radiusSm, background: T.grnDim + "22", color: T.grn, border: `1px solid ${T.grn}44`, fontSize: 12, fontWeight: 600 }}
                >
                  📥 Receber
                </button>
                <button
                  onClick={() => onDeleteExtra(item.id)}
                  style={{ padding: "6px 8px", borderRadius: T.radiusSm, background: "transparent", color: T.red, border: `1px solid ${T.red}33` }}
                >
                  <Ic n="trash" s={13} c={T.red} />
                </button>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderTop: `1px solid ${T.bdrBr}`, background: T.sur }}>
              <span style={{ fontSize: 13, color: T.txtM, fontWeight: 600 }}>TOTAL ESTIMADO — EXTRAS</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: T.amber }}>{fmt(totalEstExtra)}</span>
            </div>
          </div>
        </>
      )}

      {/* Total geral */}
      {(autoItems.length > 0 || extras.length > 0) && (
        <div style={{ background: T.amber + "18", border: `1px solid ${T.amber}44`, borderRadius: T.radius, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.amber }}>TOTAL GERAL DA LISTA</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: T.amber }}>{fmt(totalGeral)}</span>
        </div>
      )}

      {/* Modal Receber */}
      {showReceive && (
        <Modal title={`Receber — ${showReceive.item.name}`} onClose={() => setShowReceive(null)} width={440}>
          <div style={{ background: T.sur, borderRadius: T.radiusSm, padding: 12, marginBottom: 16 }}>
            {showReceive.type === "stock" ? (
              <p style={{ fontSize: 13, color: T.txtM }}>
                Estoque atual:{" "}
                <strong style={{ color: T.red }}>{showReceive.item.qty} {showReceive.item.unit}</strong> →
                Meta:{" "}
                <strong style={{ color: T.grn }}>{showReceive.item.minQty * 2} {showReceive.item.unit}</strong>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: T.txtM }}>Item extra — não vinculado ao estoque automático.</p>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>
                QTD. RECEBIDA ({showReceive.item.unit}) *
              </label>
              <input type="number" step="0.01" min="0" value={recQty} onChange={(e) => setRecQty(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>CUSTO UNIT. PAGO (R$)</label>
              <input type="number" step="0.01" min="0" value={recCost} onChange={(e) => setRecCost(e.target.value)} />
            </div>
          </div>
          {recQty && recCost && (
            <div style={{ background: T.red + "11", border: `1px solid ${T.red}33`, borderRadius: T.radiusSm, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: T.txtM }}>Total a debitar da conta</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: T.red }}>
                {fmt((parseFloat(recQty) || 0) * (parseFloat(recCost) || 0))}
              </span>
            </div>
          )}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>💳 PAGAR COM QUAL CONTA? *</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {accounts.map((acc) => {
                const selected = recAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => setRecAccountId(acc.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: T.radiusSm, background: selected ? acc.color + "22" : T.card, border: selected ? `2px solid ${acc.color}` : `1px solid ${T.bdr}`, color: T.txt, textAlign: "left" }}
                  >
                    <span style={{ fontSize: 18 }}>{acc.icon}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: selected ? 600 : 400 }}>{acc.name}</span>
                    {selected && <Ic n="check" s={16} c={acc.color} />}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={doReceive} full variant="success">
              <Ic n="check" s={16} c="#fff" /> Confirmar Recebimento
            </Btn>
            <Btn onClick={() => setShowReceive(null)} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal Item Extra */}
      {showAddExtra && (
        <Modal title="Adicionar Item Extra" onClose={() => setShowAddExtra(false)} width={460}>
          <p style={{ fontSize: 13, color: T.txtM, marginBottom: 16 }}>
            Use para compras que não fazem parte do estoque cadastrado (ex: produto novo, material de limpeza).
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>ITEM *</label>
              <input value={extraForm.name} onChange={(e) => setExtraForm({ ...extraForm, name: e.target.value })} placeholder="Nome do produto" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>QUANTIDADE *</label>
                <input type="number" step="0.01" min="0" value={extraForm.qty} onChange={(e) => setExtraForm({ ...extraForm, qty: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>UNIDADE</label>
                <select value={extraForm.unit} onChange={(e) => setExtraForm({ ...extraForm, unit: e.target.value })}>
                  {["un", "kg", "g", "L", "ml", "cx", "pct", "saco", "lt", "dz"].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>CUSTO EST. (R$)</label>
                <input type="number" step="0.01" min="0" value={extraForm.cost} onChange={(e) => setExtraForm({ ...extraForm, cost: e.target.value })} placeholder="0,00" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>FORNECEDOR</label>
                <input value={extraForm.supplier} onChange={(e) => setExtraForm({ ...extraForm, supplier: e.target.value })} placeholder="Opcional" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn onClick={addExtra} full>Adicionar</Btn>
              <Btn onClick={() => setShowAddExtra(false)} variant="ghost" full>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ListaCompras;
