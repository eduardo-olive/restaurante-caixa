import { useState } from "react";
import T from "../theme/index.js";
import { uid, fmt, groupBy } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Btn from "../components/Btn.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";

const Produtos = ({ products, onSave, onDelete }) => {
  const [showNew, setShowNew] = useState(false);
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cat, setCat] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cats = [...new Set(products.map((p) => p.category))];
  const grouped = groupBy(products, (p) => p.category);

  const openEdit = (p) => {
    setEdit(p); setName(p.name); setPrice(p.price); setCat(p.category); setShowNew(true);
  };
  const save = () => {
    if (!name || !price) return;
    const p = edit
      ? { ...edit, name, price: parseFloat(price), category: cat || "Geral" }
      : { id: uid(), name, price: parseFloat(price), category: cat || "Geral", active: true };
    onSave(p);
    setShowNew(false); setEdit(null); setName(""); setPrice(""); setCat("");
  };

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Cardápio / Produtos</h2>
          <p style={{ color: T.txtM, fontSize: 14, marginTop: 4 }}>
            {products.filter((p) => p.active).length} itens ativos
          </p>
        </div>
        <Btn onClick={() => { setEdit(null); setName(""); setPrice(""); setCat(""); setShowNew(true); }}>
          <Ic n="plus" s={16} c="#1a0e00" /> Novo Produto
        </Btn>
      </div>

      {Object.entries(grouped).map(([catName, items]) => (
        <div key={catName} style={{ marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 13, fontWeight: 600, color: T.txtM, marginBottom: 10,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Ic n="tag" s={13} c={T.amber} /> {catName.toUpperCase()}
          </h3>
          <div
            style={{
              background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, overflow: "hidden",
            }}
          >
            {items.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex", alignItems: "center", padding: "12px 16px",
                  borderBottom: i < items.length - 1 ? `1px solid ${T.bdr}` : "none",
                  opacity: p.active ? 1 : 0.45,
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
                  {!p.active && <Badge color={T.red} style={{ marginLeft: 8 }}>Inativo</Badge>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.amber, marginRight: 20 }}>
                  {fmt(p.price)}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={() => openEdit(p)} variant="ghost" size="sm"><Ic n="edit" s={14} /></Btn>
                  {confirmDeleteId === p.id ? (
                    <>
                      <Btn onClick={() => { onDelete(p.id); setConfirmDeleteId(null); }} variant="danger" size="sm">Sim</Btn>
                      <Btn onClick={() => setConfirmDeleteId(null)} variant="ghost" size="sm">Não</Btn>
                    </>
                  ) : (
                    <Btn onClick={() => setConfirmDeleteId(p.id)} variant="danger" size="sm"><Ic n="trash" s={14} /></Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showNew && (
        <Modal title={edit ? "Editar Produto" : "Novo Produto"} onClose={() => { setShowNew(false); setEdit(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>NOME DO PRODUTO *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Picanha Grelhada" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>PREÇO (R$) *</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>CATEGORIA</label>
              <input value={cat} onChange={(e) => setCat(e.target.value)} placeholder="Ex: Carnes, Bebidas..." list="cats-prod" />
              <datalist id="cats-prod">{cats.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Btn onClick={save} full>Salvar</Btn>
              <Btn onClick={() => { setShowNew(false); setEdit(null); }} variant="ghost" full>Cancelar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Produtos;
