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
  const [items,      setItems]      = useState(() =>
    (editOrder?.items ?? []).map(i => ({ obs: "", discount: 0, ...i }))
  );
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("Todos");
  const [orderDiscount, setOrderDiscount] = useState(editOrder?.discount ?? 0);

  // Split payment state
  const [showSplit, setShowSplit]     = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({});

  // Per-item obs toggle
  const [obsOpen, setObsOpen] = useState({});

  useEffect(() => {
    if (editOrder) {
      setTable(editOrder.table);
      setClientName(editOrder.clientName ?? "");
      setItems((editOrder.items ?? []).map(i => ({ obs: "", discount: 0, ...i })));
      setOrderDiscount(editOrder.discount ?? 0);
    } else {
      setTable(""); setClientName(""); setItems([]); setOrderDiscount(0);
    }
    setShowSplit(false); setSplitAmounts({}); setObsOpen({});
  }, [editOrder?.id]);

  const activeProducts = products.filter((p) => p.active);
  const cats = ["Todos", ...new Set(activeProducts.map((p) => p.category))];
  const filtered = activeProducts.filter(
    (p) =>
      (catFilter === "Todos" || p.category === catFilter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Cálculos com desconto ──
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const itemDiscountTotal = items.reduce(
    (s, i) => s + i.price * i.qty * (i.discount || 0) / 100, 0
  );
  const afterItemDiscounts = subtotal - itemDiscountTotal;
  const orderDiscountAmount = afterItemDiscounts * (orderDiscount / 100);
  const total = Math.round((afterItemDiscounts - orderDiscountAmount) * 100) / 100;
  const hasAnyDiscount = itemDiscountTotal > 0 || orderDiscountAmount > 0;

  // Mesa duplicada
  const dupOrder = table.trim()
    ? orders.find(
        (o) =>
          o.status === "aberta" &&
          o.table.trim().toLowerCase() === table.trim().toLowerCase() &&
          o.id !== editOrder?.id
      )
    : null;

  // ── Item actions ──
  const addItem = (p) =>
    setItems((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      return ex
        ? prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...p, qty: 1, obs: "", discount: 0 }];
    });

  const changeQty = (id, delta) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setObsOpen((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const updateItemObs = (id, obs) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, obs } : i)));

  const updateItemDiscount = (id, val) => {
    const d = Math.min(100, Math.max(0, Number(val) || 0));
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, discount: d } : i)));
  };

  const canSave = !dupOrder && !!table.trim() && items.length > 0;

  // ── Build order object ──
  const buildOrder = (status, accountId = null, payments = null) => {
    const base = {
      table, clientName, items,
      subtotal, discount: orderDiscount, total,
      status, accountId, payments,
    };
    if (isEdit) {
      return { ...editOrder, ...base,
        ...(status === "fechada" ? { closedAt: new Date().toISOString() } : {}) };
    }
    return { ...base, id: uid(),
      attendantId: user.id, attendantName: user.name,
      createdAt: new Date().toISOString(),
      ...(status === "fechada" ? { closedAt: new Date().toISOString() } : {}),
    };
  };

  const handleClose = (accountId) => {
    if (!canSave) return;
    onSave(buildOrder("fechada", accountId, [{ accountId, amount: total }]));
    setView("comandas");
  };

  const handleCloseSplit = () => {
    if (!canSave) return;
    const payments = Object.entries(splitAmounts)
      .filter(([, amount]) => amount > 0)
      .map(([accountId, amount]) => ({ accountId, amount: Math.round(amount * 100) / 100 }));
    if (payments.length === 0) return;
    const sum = payments.reduce((s, p) => s + p.amount, 0);
    if (Math.abs(total - sum) > 0.01) return;
    onSave(buildOrder("fechada", payments[0].accountId, payments));
    setView("comandas");
  };

  const handleSaveOpen = () => {
    if (!canSave) return;
    onSave(buildOrder("aberta"));
    setView("comandas");
  };

  // ── Split helpers ──
  const splitTotal = Object.values(splitAmounts).reduce((s, v) => s + (v || 0), 0);
  const splitRemaining = Math.round((total - splitTotal) * 100) / 100;
  const splitValid = Math.abs(splitRemaining) < 0.01 && Object.values(splitAmounts).some(v => v > 0);

  const handleSplitEqual = () => {
    const n = accounts.length;
    if (n === 0) return;
    const each = Math.floor(total / n * 100) / 100;
    const amounts = {};
    accounts.forEach((a, i) => {
      amounts[a.id] = i === n - 1 ? Math.round((total - each * (n - 1)) * 100) / 100 : each;
    });
    setSplitAmounts(amounts);
  };

  const itemTotal = (i) => {
    const sub = i.price * i.qty;
    return Math.round((sub - sub * (i.discount || 0) / 100) * 100) / 100;
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
      <div style={{ width: 340, background: T.sur, borderLeft: `1px solid ${T.bdr}`, display: "flex", flexDirection: "column" }}>

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
                  {/* Obs display */}
                  {item.obs && !obsOpen[item.id] && (
                    <div style={{ fontSize: 11, color: T.amber, fontStyle: "italic", marginTop: 2 }}>
                      📝 {item.obs}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => setObsOpen(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    title="Observação"
                    style={{
                      background: item.obs ? T.amber + "22" : "none",
                      color: item.obs ? T.amber : T.txtS,
                      padding: 2, borderRadius: 4,
                      border: item.obs ? `1px solid ${T.amber}44` : "none",
                    }}
                  >
                    <Ic n="edit" s={13} c={item.obs ? T.amber : T.txtS} />
                  </button>
                  <button onClick={() => removeItem(item.id)} style={{ background: "none", color: T.red, padding: 2 }}>
                    <Ic n="trash" s={14} c={T.red} />
                  </button>
                </div>
              </div>

              {/* Obs input (toggled) */}
              {obsOpen[item.id] && (
                <input
                  value={item.obs || ""}
                  onChange={(e) => updateItemObs(item.id, e.target.value)}
                  placeholder="Ex: sem cebola, bem passado..."
                  style={{
                    marginTop: 6, fontSize: 12, padding: "6px 10px",
                    background: T.card, border: `1px solid ${T.amber}33`,
                    borderRadius: T.radiusSm, width: "100%",
                  }}
                />
              )}

              {/* Qty + discount + total */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button onClick={() => changeQty(item.id, -1)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: T.card, border: `1px solid ${T.bdr}`, color: T.txt, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <span style={{ minWidth: 28, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: T.card, border: `1px solid ${T.bdr}`, color: T.txt, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
                {/* Item discount */}
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <input
                    type="number" min="0" max="100" step="1"
                    value={item.discount || ""}
                    onChange={(e) => updateItemDiscount(item.id, e.target.value)}
                    placeholder="0"
                    style={{
                      width: 38, fontSize: 11, padding: "4px 4px", textAlign: "center",
                      background: T.card, border: `1px solid ${item.discount ? T.pur + "55" : T.bdr}`,
                      borderRadius: 4, color: item.discount ? T.pur : T.txtM,
                    }}
                  />
                  <span style={{ fontSize: 10, color: T.txtS }}>%</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.discount ? T.pur : T.amber }}>
                  {fmt(itemTotal(item))}
                </span>
              </div>
              {item.discount > 0 && (
                <div style={{ fontSize: 10, color: T.pur, textAlign: "right", marginTop: 2 }}>
                  −{fmt(item.price * item.qty * item.discount / 100)} desc. item
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer ações */}
        <div style={{ padding: 16, borderTop: `1px solid ${T.bdrBr}` }}>

          {/* Desconto da comanda */}
          {items.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
              padding: "8px 10px", background: T.card, borderRadius: T.radiusSm,
              border: `1px solid ${orderDiscount > 0 ? T.pur + "44" : T.bdr}`,
            }}>
              <span style={{ fontSize: 12, color: T.txtM, flex: 1 }}>Desconto geral</span>
              <input
                type="number" min="0" max="100" step="1"
                value={orderDiscount || ""}
                onChange={(e) => setOrderDiscount(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                placeholder="0"
                style={{
                  width: 44, fontSize: 12, padding: "4px 6px", textAlign: "center",
                  background: T.sur, border: `1px solid ${orderDiscount > 0 ? T.pur + "55" : T.bdr}`,
                  borderRadius: 4, color: orderDiscount > 0 ? T.pur : T.txtM,
                }}
              />
              <span style={{ fontSize: 11, color: T.txtS }}>%</span>
            </div>
          )}

          {/* Subtotal / Descontos / Total */}
          {hasAnyDiscount ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.txtM, marginBottom: 4 }}>
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {itemDiscountTotal > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.pur, marginBottom: 4 }}>
                  <span>Desc. itens</span>
                  <span>−{fmt(itemDiscountTotal)}</span>
                </div>
              )}
              {orderDiscountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.pur, marginBottom: 4 }}>
                  <span>Desc. comanda ({orderDiscount}%)</span>
                  <span>−{fmt(orderDiscountAmount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: `1px solid ${T.bdr}` }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: T.amber }}>{fmt(total)}</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: T.amber }}>{fmt(total)}</span>
            </div>
          )}

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
              {/* Salvar aberto / Salvar alterações */}
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

              {/* ── Pagamento único ── */}
              {!showSplit && (
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
              )}

              {/* ── Botão dividir conta ── */}
              <button
                onClick={() => {
                  setShowSplit(!showSplit);
                  if (!showSplit) setSplitAmounts({});
                }}
                disabled={!canSave}
                style={{
                  width: "100%", padding: "8px 0", marginTop: showSplit ? 0 : 6,
                  borderRadius: T.radiusSm,
                  background: showSplit ? T.blue + "22" : "transparent",
                  border: `1px solid ${showSplit ? T.blue + "55" : T.bdr}`,
                  color: showSplit ? T.blue : T.txtM,
                  fontSize: 12, fontWeight: 600,
                  opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed",
                }}
              >
                {showSplit ? "✕ Cancelar Divisão" : "➗ Dividir Conta"}
              </button>

              {/* ── Split payment panel ── */}
              {showSplit && canSave && (
                <div style={{
                  marginTop: 10, padding: 12, borderRadius: T.radius,
                  background: T.card, border: `1px solid ${T.blue}33`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.blue }}>DIVIDIR ENTRE CONTAS</span>
                    <button onClick={handleSplitEqual}
                      style={{
                        padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                        background: T.blue + "22", border: `1px solid ${T.blue}44`, color: T.blue,
                      }}>
                      Dividir igual
                    </button>
                  </div>

                  {accounts.map((acc) => (
                    <div key={acc.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>{acc.icon}</span>
                      <span style={{ fontSize: 12, color: T.txt, flex: 1 }}>{acc.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 11, color: T.txtS }}>R$</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={splitAmounts[acc.id] ?? ""}
                          onChange={(e) => setSplitAmounts(prev => ({
                            ...prev, [acc.id]: Number(e.target.value) || 0,
                          }))}
                          placeholder="0,00"
                          style={{
                            width: 80, fontSize: 13, padding: "6px 8px", textAlign: "right",
                            background: T.sur, border: `1px solid ${T.bdr}`,
                            borderRadius: 4, color: T.txt,
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Remaining */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", marginTop: 4, borderTop: `1px solid ${T.bdr}`,
                  }}>
                    <span style={{ fontSize: 12, color: T.txtM }}>Restante:</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: Math.abs(splitRemaining) < 0.01 ? T.grn : T.red,
                    }}>
                      {fmt(splitRemaining)}
                    </span>
                  </div>

                  <button
                    onClick={handleCloseSplit}
                    disabled={!splitValid}
                    style={{
                      width: "100%", padding: "10px 0", marginTop: 8,
                      borderRadius: T.radiusSm,
                      background: splitValid ? T.blue : T.card,
                      border: splitValid ? "none" : `1px solid ${T.bdr}`,
                      color: splitValid ? "#fff" : T.txtS,
                      fontSize: 13, fontWeight: 700,
                      opacity: splitValid ? 1 : 0.5, cursor: splitValid ? "pointer" : "not-allowed",
                    }}
                  >
                    ✓ Confirmar Pagamento Dividido
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NovaComanda;
