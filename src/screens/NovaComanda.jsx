import { useState, useEffect } from "react";
import T from "../theme/index.js";
import { uid, fmt } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// NovaComanda
//   editOrder  → comanda existente para adicionar itens (opcional)
//   orders     → lista completa para validar mesa duplicada
// ─────────────────────────────────────────────────────────────────────────────
const NovaComanda = ({ products, accounts, user, onSave, setView, editOrder = null, orders = [] }) => {
  const isEdit = !!editOrder;

  const [table,      setTable]      = useState(editOrder?.table      ?? "");
  const [clientName, setClientName] = useState(editOrder?.clientName ?? "");
  const [items,      setItems]      = useState(editOrder?.items      ?? []);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("Todos");

  useEffect(() => {
    if (editOrder) {
      setTable(editOrder.table);
      setClientName(editOrder.clientName ?? "");
      setItems(editOrder.items ?? []);
    } else {
      setTable(""); setClientName(""); setItems([]);
    }
  }, [editOrder?.id]);

  const activeProducts = products.filter((p) => p.active);
  const cats = ["Todos", ...new Set(activeProducts.map((p) => p.category))];
  const filtered = activeProducts.filter(
    (p) =>
      (catFilter === "Todos" || p.category === catFilter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  // Mesa duplicada: outra comanda aberta para a mesma mesa (exceto a própria em edição)
  const dupOrder = table.trim()
    ? orders.find(
        (o) =>
          o.status === "aberta" &&
          o.table.trim().toLowerCase() === table.trim().toLowerCase() &&
          o.id !== editOrder?.id
      )
    : null;

  const addItem = (p) =>
    setItems((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      return ex ? prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { ...p, qty: 1 }];
    });

  const changeQty = (id, delta) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const canSave = !dupOrder && !!table.trim() && items.length > 0;

  const handleClose = (accountId) => {
    if (!canSave) return;
    if (isEdit) {
      onSave({ ...editOrder, table, clientName, items, total,
        status: "fechada", accountId, closedAt: new Date().toISOString() });
    } else {
      onSave({ id: uid(), table, clientName, items, total, accountId,
        attendantId: user.id, attendantName: user.name,
        status: "fechada", createdAt: new Date().toISOString(), closedAt: new Date().toISOString() });
    }
    setView("comandas");
  };

  const handleSaveOpen = () => {
    if (!canSave) return;
    if (isEdit) {
      onSave({ ...editOrder, table, clientName, items, total });
    } else {
      onSave({ id: uid(), table, clientName, items, total, accountId: null,
        attendantId: user.id, attendantName: user.name,
        status: "aberta", createdAt: new Date().toISOString() });
    }
    setView("comandas");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }} className="fade-in">

      {/* ── Left ── */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setView(isEdit ? "comandas" : "dashboard")}
            style={{ background: "none", color: T.txtM, display: "flex", borderRadius: 6, padding: 6 }}
          >
            <Ic n="back" s={20} />
          </button>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              {isEdit ? `Adicionar Itens — Mesa ${editOrder.table}` : "Nova Comanda"}
            </h2>
            {isEdit && (
              <p style={{ fontSize: 12, color: T.amber, marginTop: 2 }}>
                Editando comanda existente
              </p>
            )}
          </div>
        </div>

        {/* Mesa + cliente */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: T.txtM, fontWeight: 500, display: "block", marginBottom: 5 }}>
              MESA *
            </label>
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder="Ex: 5, A3, Balcão"
              disabled={isEdit}
              style={{ opacity: isEdit ? 0.6 : 1 }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 12, color: T.txtM, fontWeight: 500, display: "block", marginBottom: 5 }}>
              CLIENTE (opcional)
            </label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
        </div>

        {/* ── Alerta mesa duplicada ── */}
        {dupOrder && (
          <div style={{
            background: T.red + "18",
            border: `1px solid ${T.red}66`,
            borderRadius: T.radius,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <Ic n="alert" s={20} c={T.red} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.red }}>
                Mesa {dupOrder.table} já tem comanda aberta!
              </div>
              <div style={{ fontSize: 12, color: T.txtM, marginTop: 2 }}>
                {dupOrder.clientName && `${dupOrder.clientName} • `}
                {dupOrder.items.length} item(s) •&nbsp;
                {fmt(dupOrder.total)} • Aberta por {dupOrder.attendantName}
              </div>
            </div>
            <button
              onClick={() => setView("comandas")}
              style={{
                padding: "7px 14px",
                borderRadius: T.radiusSm,
                background: T.red + "33",
                border: `1px solid ${T.red}55`,
                color: T.red,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Ver comanda →
            </button>
          </div>
        )}

        {/* Busca */}
        <div style={{ marginBottom: 14 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍  Buscar produto..." />
        </div>

        {/* Filtros de categoria */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: catFilter === c ? T.amber : T.card,
                color: catFilter === c ? "#1a0e00" : T.txtM,
                border: catFilter === c ? "none" : `1px solid ${T.bdr}`,
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid de produtos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
          {filtered.map((p) => {
            const inCart = items.find((i) => i.id === p.id);
            return (
              <button key={p.id} onClick={() => addItem(p)}
                style={{
                  background: inCart ? T.amber + "22" : T.card,
                  border: `1px solid ${inCart ? T.amber + "55" : T.bdr}`,
                  borderRadius: T.radius, padding: "14px 12px", textAlign: "left", color: T.txt, transition: "all .15s",
                }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: T.txtM }}>{p.category}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.amber, marginTop: 8 }}>{fmt(p.price)}</div>
                {inCart && <div style={{ fontSize: 11, color: T.grn, marginTop: 4, fontWeight: 600 }}>✓ {inCart.qty}x no pedido</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: resumo ── */}
      <div style={{ width: 320, background: T.sur, borderLeft: `1px solid ${T.bdr}`, display: "flex", flexDirection: "column" }}>

        <div style={{ padding: "20px 20px 14px", borderBottom: `1px solid ${T.bdr}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>
            {table ? `Mesa ${table}` : "Pedido"}{clientName && ` — ${clientName}`}
          </h3>
          <div style={{ fontSize: 12, color: T.txtM, marginTop: 2 }}>
            Atendente: {user.name}
            {isEdit && <span style={{ marginLeft: 8, color: T.amber, fontWeight: 600 }}>• Editando</span>}
          </div>
        </div>

        {/* Lista de itens */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {items.length === 0 && (
            <div style={{ textAlign: "center", color: T.txtS, marginTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
              <p style={{ fontSize: 13 }}>Selecione os itens ao lado</p>
            </div>
          )}
          {items.map((item) => (
            <div key={item.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.bdr}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: T.txtM }}>{fmt(item.price)} un.</div>
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: "none", color: T.red, padding: 2 }}>
                  <Ic n="trash" s={14} c={T.red} />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button onClick={() => changeQty(item.id, -1)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: T.card, border: `1px solid ${T.bdr}`, color: T.txt, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ minWidth: 28, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: T.card, border: `1px solid ${T.bdr}`, color: T.txt, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>{fmt(item.price * item.qty)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer ações */}
        <div style={{ padding: 16, borderTop: `1px solid ${T.bdrBr}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.amber }}>{fmt(total)}</span>
          </div>

          {dupOrder ? (
            <div style={{
              padding: "12px 14px", borderRadius: T.radius,
              background: T.red + "11", border: `1px solid ${T.red}33`,
              textAlign: "center", fontSize: 13, color: T.red, fontWeight: 500,
            }}>
              🚫 Resolva o conflito de mesa antes de salvar
            </div>
          ) : (
            <>
              {/* Salvar aberto / Salvar alterações — aparece sempre */}
              <button
                onClick={handleSaveOpen}
                disabled={!canSave}
                style={{
                  width: "100%", padding: "10px 0", marginBottom: 10,
                  borderRadius: T.radiusSm,
                  background: isEdit ? T.amber : "transparent",
                  border: isEdit ? "none" : `1px dashed ${T.bdrBr}`,
                  color: isEdit ? "#1a0e00" : T.txtM,
                  fontSize: 13, fontWeight: isEdit ? 700 : 500,
                  opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed",
                }}
              >
                {isEdit ? "💾 Salvar Alterações" : "📋 Salvar Comanda em Aberto"}
              </button>

              {/* Fechar com pagamento */}
              <div>
                <div style={{ fontSize: 11, color: T.txtM, fontWeight: 600, marginBottom: 8 }}>
                  {isEdit ? "FECHAR AGORA COM:" : "FECHAR COM FORMA DE PAGAMENTO:"}
                </div>
                {accounts.map((acc) => (
                  <button key={acc.id} onClick={() => handleClose(acc.id)} disabled={!canSave}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 14px", borderRadius: T.radiusSm,
                      background: T.card, border: `1px solid ${acc.color}44`,
                      color: T.txt, marginBottom: 6, fontSize: 13, fontWeight: 500, textAlign: "left",
                      opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed",
                    }}>
                    <span style={{ fontSize: 18 }}>{acc.icon}</span>
                    {acc.name}
                    <span style={{ marginLeft: "auto", color: acc.color }}>{fmt(total)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovaComanda;
