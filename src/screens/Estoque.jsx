import { useState } from "react";
import T from "../theme/index.js";
import { uid, fmt } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Btn from "../components/Btn.jsx";
import Modal from "../components/Modal.jsx";

const Estoque = ({ stock, onSave, onDelete, onAdjust }) => {
  const [showNew, setShowNew] = useState(false);
  const [edit, setEdit] = useState(null);
  const [showAdj, setShowAdj] = useState(null);
  const [adjQty, setAdjQty] = useState("");
  const [adjType, setAdjType] = useState("entrada");
  const [adjObs, setAdjObs] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [filterAlert, setFilterAlert] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", unit: "un", qty: "", minQty: "", cost: "", supplier: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cats = ["Todos", ...new Set(stock.map((s) => s.category))];
  const low = stock.filter((s) => s.qty <= s.minQty);
  const filtered = stock.filter(
    (s) =>
      (filterCat === "Todos" || s.category === filterCat) &&
      (!filterAlert || s.qty <= s.minQty)
  );
  const totalValue = stock.reduce((sum, s) => sum + s.qty * s.cost, 0);

  const openEdit = (s) => {
    setEdit(s);
    setForm({ name: s.name, category: s.category, unit: s.unit, qty: s.qty, minQty: s.minQty, cost: s.cost, supplier: s.supplier || "" });
    setShowNew(true);
  };
  const saveItem = () => {
    if (!form.name || form.qty === "" || form.cost === "") return;
    const item = edit
      ? { ...edit, ...form, qty: parseFloat(form.qty), minQty: parseFloat(form.minQty) || 0, cost: parseFloat(form.cost) }
      : { id: uid(), ...form, qty: parseFloat(form.qty), minQty: parseFloat(form.minQty) || 0, cost: parseFloat(form.cost) };
    onSave(item);
    setShowNew(false); setEdit(null);
    setForm({ name: "", category: "", unit: "un", qty: "", minQty: "", cost: "", supplier: "" });
  };
  const doAdjust = () => {
    if (!adjQty || isNaN(adjQty) || parseFloat(adjQty) <= 0) return;
    const delta = adjType === "entrada" ? parseFloat(adjQty) : -parseFloat(adjQty);
    onAdjust(showAdj.id, delta, adjType, adjObs);
    setShowAdj(null); setAdjQty(""); setAdjObs(""); setAdjType("entrada");
  };

  const statusColor = (s) => {
    if (s.qty === 0) return T.red;
    if (s.qty <= s.minQty) return "#f97316";
    if (s.qty <= s.minQty * 1.5) return T.amber;
    return T.grn;
  };
  const statusLabel = (s) => {
    if (s.qty === 0) return "Sem estoque";
    if (s.qty <= s.minQty) return "Crítico";
    if (s.qty <= s.minQty * 1.5) return "Baixo";
    return "OK";
  };

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Controle de Estoque</h2>
          <p style={{ color: T.txtM, fontSize: 14, marginTop: 4 }}>
            {stock.length} itens • Valor total em estoque:{" "}
            <strong style={{ color: T.amber }}>{fmt(totalValue)}</strong>
            {low.length > 0 && (
              <span style={{ color: "#f97316", marginLeft: 12, fontWeight: 600 }}>
                ⚠ {low.length} item(s) com estoque baixo
              </span>
            )}
          </p>
        </div>
        <Btn onClick={() => { setEdit(null); setForm({ name: "", category: "", unit: "un", qty: "", minQty: "", cost: "", supplier: "" }); setShowNew(true); }}>
          <Ic n="plus" s={16} c="#1a0e00" /> Novo Item
        </Btn>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { label: "Total de Itens",    value: stock.length,                                        color: T.blue,   icon: "📦" },
          { label: "Valor em Estoque",  value: fmt(totalValue),                                     color: T.amber,  icon: "💰" },
          { label: "Estoque Crítico",   value: stock.filter((s) => s.qty <= s.minQty && s.qty > 0).length, color: "#f97316", icon: "⚠️" },
          { label: "Sem Estoque",       value: stock.filter((s) => s.qty === 0).length,             color: T.red,    icon: "❌" },
        ].map((c) => (
          <div key={c.label} style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, padding: 16 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 11, color: T.txtM, marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              background: filterCat === c ? T.amber : T.card,
              color: filterCat === c ? "#1a0e00" : T.txtM,
              border: filterCat === c ? "none" : `1px solid ${T.bdr}`,
            }}
          >
            {c}
          </button>
        ))}
        <button
          onClick={() => setFilterAlert(!filterAlert)}
          style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, marginLeft: "auto",
            background: filterAlert ? "#f97316" : T.card,
            color: filterAlert ? "#fff" : T.txtM,
            border: filterAlert ? "none" : `1px solid ${T.bdr}`,
          }}
        >
          ⚠ Só alertas
        </button>
      </div>

      {/* Table */}
      <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, overflow: "hidden" }}>
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 90px 130px",
            padding: "10px 16px", borderBottom: `1px solid ${T.bdrBr}`, fontSize: 11, fontWeight: 600, color: T.txtM,
          }}
        >
          <span>ITEM / CATEGORIA</span>
          <span style={{ textAlign: "center" }}>ESTOQUE</span>
          <span style={{ textAlign: "center" }}>MÍNIMO</span>
          <span style={{ textAlign: "center" }}>CUSTO UNIT.</span>
          <span style={{ textAlign: "center" }}>STATUS</span>
          <span style={{ textAlign: "right" }}>AÇÕES</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: T.txtM }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <p>Nenhum item encontrado</p>
          </div>
        )}

        {filtered.map((s, i) => {
          const sc = statusColor(s);
          return (
            <div
              key={s.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 90px 90px 90px 90px 130px",
                padding: "12px 16px", borderBottom: i < filtered.length - 1 ? `1px solid ${T.bdr}` : "none",
                alignItems: "center",
                background: s.qty === 0 ? "rgba(248,113,113,0.04)" : s.qty <= s.minQty ? "rgba(249,115,22,0.04)" : "transparent",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: T.txtM }}>{s.category}{s.supplier && ` • ${s.supplier}`}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: sc }}>{s.qty}</span>
                <span style={{ fontSize: 11, color: T.txtM, marginLeft: 3 }}>{s.unit}</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 13, color: T.txtM }}>{s.minQty} {s.unit}</div>
              <div style={{ textAlign: "center", fontSize: 13, color: T.amber }}>{fmt(s.cost)}</div>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: sc, background: sc + "22", padding: "3px 8px", borderRadius: 20 }}>
                  {statusLabel(s)}
                </span>
              </div>
              <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                <button
                  onClick={() => { setShowAdj(s); setAdjType("entrada"); setAdjQty(""); setAdjObs(""); }}
                  title="Ajustar estoque"
                  style={{ padding: "5px 8px", borderRadius: T.radiusSm, background: T.amber + "22", color: T.amber, border: `1px solid ${T.amber}44`, fontSize: 11, fontWeight: 600 }}
                >
                  ±
                </button>
                {s.qty <= s.minQty && (
                  <span
                    title="Na lista de compras automática"
                    style={{ padding: "5px 8px", borderRadius: T.radiusSm, background: T.blue + "22", color: T.blue, border: `1px solid ${T.blue}44`, fontSize: 10, fontWeight: 700 }}
                  >
                    🛒
                  </span>
                )}
                <button
                  onClick={() => openEdit(s)}
                  style={{ padding: "5px 7px", borderRadius: T.radiusSm, background: T.card, color: T.txtM, border: `1px solid ${T.bdr}` }}
                >
                  <Ic n="edit" s={13} />
                </button>
                {confirmDeleteId === s.id ? (
                  <>
                    <button
                      onClick={() => { onDelete(s.id); setConfirmDeleteId(null); }}
                      style={{ padding: "5px 8px", borderRadius: T.radiusSm, background: T.redDim, color: "#fff", fontSize: 10, fontWeight: 700 }}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      style={{ padding: "5px 8px", borderRadius: T.radiusSm, background: T.card, color: T.txtM, border: `1px solid ${T.bdr}`, fontSize: 10 }}
                    >
                      Não
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(s.id)}
                    style={{ padding: "5px 7px", borderRadius: T.radiusSm, background: T.redDim + "22", color: T.red, border: `1px solid ${T.red}33` }}
                  >
                    <Ic n="trash" s={13} c={T.red} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Modal */}
      {showAdj && (
        <Modal title={`Ajuste de Estoque — ${showAdj.name}`} onClose={() => setShowAdj(null)} width={420}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {["entrada", "saida", "ajuste"].map((t) => (
                <button
                  key={t}
                  onClick={() => setAdjType(t)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: T.radiusSm, fontSize: 13, fontWeight: 600,
                    background: adjType === t ? (t === "entrada" ? T.grnDim : t === "saida" ? T.redDim : T.amber) : T.card,
                    color: adjType === t ? "#fff" : T.txtM,
                    border: `1px solid ${T.bdr}`,
                  }}
                >
                  {t === "entrada" ? "📥 Entrada" : t === "saida" ? "📤 Saída" : "🔧 Ajuste"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.sur, borderRadius: T.radiusSm, padding: "10px 14px", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: T.txtM }}>Estoque atual:</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: T.amber }}>{showAdj.qty} {showAdj.unit}</span>
            </div>
            <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>
              {adjType === "ajuste" ? "NOVO VALOR DE ESTOQUE" : "QUANTIDADE"}
            </label>
            <input type="number" step="0.01" min="0" value={adjQty} onChange={(e) => setAdjQty(e.target.value)}
              placeholder={`Ex: 10 ${showAdj.unit}`} style={{ marginBottom: 12 }} />
            <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>OBSERVAÇÃO (opcional)</label>
            <input value={adjObs} onChange={(e) => setAdjObs(e.target.value)} placeholder="Ex: Compra de fornecedor, perda, inventário..." />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <Btn onClick={doAdjust} full variant={adjType === "saida" ? "danger" : "primary"}>
              Confirmar {adjType === "entrada" ? "Entrada" : adjType === "saida" ? "Saída" : "Ajuste"}
            </Btn>
            <Btn onClick={() => setShowAdj(null)} variant="ghost">Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* New/Edit Modal */}
      {showNew && (
        <Modal title={edit ? "Editar Item" : "Novo Item de Estoque"} onClose={() => { setShowNew(false); setEdit(null); }} width={500}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>NOME DO ITEM *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Cerveja 600ml" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>CATEGORIA *</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex: Bebidas, Carnes..." list="cats-stock" />
              <datalist id="cats-stock">
                {[...new Set(stock.map((s) => s.category))].map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>UNIDADE</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {["un", "kg", "g", "L", "ml", "cx", "pct", "saco", "lt", "dz"].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>QTD. ATUAL *</label>
              <input type="number" step="0.01" min="0" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>QTD. MÍNIMA (alerta)</label>
              <input type="number" step="0.01" min="0" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>CUSTO UNIT. (R$) *</label>
              <input type="number" step="0.01" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0,00" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>FORNECEDOR</label>
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Nome do fornecedor" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={saveItem} full>Salvar</Btn>
            <Btn onClick={() => { setShowNew(false); setEdit(null); }} variant="ghost" full>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Estoque;
