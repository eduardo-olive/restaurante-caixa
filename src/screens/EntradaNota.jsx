import { useState } from "react";
import T from "../theme/index.js";
import { uid, fmt } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Btn from "../components/Btn.jsx";

const EntradaNota = ({ stock, products, accounts, user, onConfirm }) => {
  const [supplier,    setSupplier]    = useState("");
  const [invoiceNo,   setInvoiceNo]   = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId,   setAccountId]   = useState(accounts[0]?.id || "");
  const [items,       setItems]       = useState([]);
  const [search,      setSearch]      = useState("");
  const [showSearch,  setShowSearch]  = useState(false);

  // Sugestões: estoque + produtos do cardápio não duplicados
  const suggestions = [
    ...stock.map((s) => ({ id: s.id, name: s.name, category: s.category, unit: s.unit, costPrice: s.cost, salePrice: 0, isStock: true })),
    ...products
      .filter((p) => p.active && !stock.some((s) => s.name.toLowerCase() === p.name.toLowerCase()))
      .map((p) => ({ id: "prod_" + p.id, name: p.name, category: p.category, unit: "un", costPrice: 0, salePrice: p.price, isStock: false })),
  ];
  const filtered = suggestions.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  const addItem = (sug) => {
    if (items.some((i) => i.ref === sug.id)) return;
    setItems((prev) => [
      ...prev,
      { ref: sug.id, name: sug.name, category: sug.category, unit: sug.unit, qty: 1, costPrice: sug.costPrice, salePrice: sug.salePrice, isStock: sug.isStock },
    ]);
    setSearch(""); setShowSearch(false);
  };

  const addCustom = () => {
    if (!search.trim()) return;
    setItems((prev) => [
      ...prev,
      { ref: "custom_" + uid(), name: search.trim(), category: "", unit: "un", qty: 1, costPrice: 0, salePrice: 0, isStock: false },
    ]);
    setSearch(""); setShowSearch(false);
  };

  const updateItem = (ref, field, val) =>
    setItems((prev) =>
      prev.map((i) =>
        i.ref === ref
          ? { ...i, [field]: ["qty", "costPrice", "salePrice"].includes(field) ? parseFloat(val) || 0 : val }
          : i
      )
    );

  const removeItem = (ref) => setItems((prev) => prev.filter((i) => i.ref !== ref));

  const totalNota   = items.reduce((s, i) => s + i.qty * i.costPrice, 0);
  const totalMarkup = items.reduce((s, i) => s + i.qty * i.salePrice, 0);
  const canConfirm  = items.length > 0 && accountId;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({ supplier, invoiceNo, invoiceDate, accountId, items, totalNota, user });
  };

  const stockCats = [...new Set(stock.map((s) => s.category))];

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }} className="fade-in">

      {/* ── Left: item input ── */}
      <div style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Entrada de Nota Fiscal</h2>
        <p style={{ color: T.txtM, fontSize: 13, marginBottom: 24 }}>
          Informe os produtos da nota, custo de compra, preço de venda e quantidade.
        </p>

        {/* Dados da nota */}
        <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.txtM, marginBottom: 12 }}>DADOS DA NOTA</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>FORNECEDOR</label>
              <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nome do fornecedor" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>Nº DA NOTA</label>
              <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder="Ex: 000123" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>DATA</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Busca produto */}
        <div style={{ marginBottom: 20, position: "relative" }}>
          <label style={{ fontSize: 12, color: T.txtM, fontWeight: 600, display: "block", marginBottom: 6 }}>
            ADICIONAR PRODUTO À NOTA
          </label>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            placeholder="🔍  Buscar no estoque ou cardápio, ou digitar novo..."
          />
          {showSearch && search.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.sur, border: `1px solid ${T.bdrBr}`, borderRadius: T.radius, zIndex: 100, maxHeight: 240, overflowY: "auto", marginTop: 4 }}>
              {filtered.slice(0, 8).map((s) => (
                <button
                  key={s.id}
                  onClick={() => addItem(s)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "transparent", color: T.txt, textAlign: "left", borderBottom: `1px solid ${T.bdr}` }}
                >
                  <span style={{ fontSize: 18 }}>{s.isStock ? "📦" : "🍽️"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: T.txtM }}>
                      {s.category} • {s.unit}{s.costPrice > 0 ? ` • Custo: ${fmt(s.costPrice)}` : ""}
                    </div>
                  </div>
                  {items.some((i) => i.ref === s.id) && (
                    <span style={{ fontSize: 11, color: T.amber }}>✓ adicionado</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <button
                  onClick={addCustom}
                  style={{ width: "100%", padding: "12px 14px", background: "transparent", color: T.amber, textAlign: "left", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
                >
                  <Ic n="plus" s={15} c={T.amber} /> Adicionar "{search}" como novo produto
                </button>
              )}
              {filtered.length > 0 && (
                <button
                  onClick={addCustom}
                  style={{ width: "100%", padding: "10px 14px", background: "transparent", color: T.txtM, textAlign: "left", fontSize: 12, borderTop: `1px solid ${T.bdr}` }}
                >
                  + Adicionar "{search}" como novo item
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tabela de itens */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: T.txtS }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
            <p style={{ fontSize: 14 }}>Busque e adicione os produtos da nota acima</p>
          </div>
        ) : (
          <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px 70px 32px", padding: "9px 14px", borderBottom: `1px solid ${T.bdrBr}`, fontSize: 11, fontWeight: 600, color: T.txtM, gap: 8 }}>
              <span>PRODUTO</span>
              <span style={{ textAlign: "center" }}>QTD</span>
              <span style={{ textAlign: "center" }}>CUSTO UNIT.</span>
              <span style={{ textAlign: "center" }}>PREÇO VENDA</span>
              <span style={{ textAlign: "center" }}>MARKUP</span>
              <span />
            </div>

            {items.map((item, idx) => (
              <div
                key={item.ref}
                style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px 70px 32px", gap: 8, padding: "10px 14px", borderBottom: idx < items.length - 1 ? `1px solid ${T.bdr}` : "none", alignItems: "center" }}
              >
                {/* Nome + categoria */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <input
                      value={item.category}
                      onChange={(e) => updateItem(item.ref, "category", e.target.value)}
                      placeholder="categoria"
                      list="cats-nota"
                      style={{ fontSize: 11, padding: "3px 6px", height: "auto", width: 110, color: T.txtM }}
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(item.ref, "unit", e.target.value)}
                      style={{ fontSize: 11, padding: "3px 6px", height: "auto", width: 60 }}
                    >
                      {["un", "kg", "g", "L", "ml", "cx", "pct", "saco", "lt", "dz"].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <datalist id="cats-nota">{stockCats.map((c) => <option key={c} value={c} />)}</datalist>
                  </div>
                </div>

                {/* Qtd */}
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <button
                    onClick={() => updateItem(item.ref, "qty", Math.max(0.1, item.qty - 1))}
                    style={{ width: 22, height: 22, borderRadius: 4, background: T.card, border: `1px solid ${T.bdr}`, color: T.txt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >−</button>
                  <input
                    type="number" min="0.01" step="0.01" value={item.qty}
                    onChange={(e) => updateItem(item.ref, "qty", e.target.value)}
                    style={{ width: 42, textAlign: "center", fontSize: 13, padding: "4px 4px" }}
                  />
                  <button
                    onClick={() => updateItem(item.ref, "qty", item.qty + 1)}
                    style={{ width: 22, height: 22, borderRadius: 4, background: T.card, border: `1px solid ${T.bdr}`, color: T.txt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >+</button>
                </div>

                {/* Custo */}
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: T.txtS, pointerEvents: "none" }}>R$</span>
                  <input type="number" min="0" step="0.01" value={item.costPrice}
                    onChange={(e) => updateItem(item.ref, "costPrice", e.target.value)}
                    style={{ paddingLeft: 26, textAlign: "right", fontSize: 13 }}
                  />
                </div>

                {/* Preço venda */}
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: T.txtS, pointerEvents: "none" }}>R$</span>
                  <input type="number" min="0" step="0.01" value={item.salePrice}
                    onChange={(e) => updateItem(item.ref, "salePrice", e.target.value)}
                    style={{ paddingLeft: 26, textAlign: "right", fontSize: 13 }}
                  />
                </div>

                {/* Markup */}
                <div style={{ textAlign: "center" }}>
                  {(() => {
                    const cost = item.costPrice, sale = item.salePrice;
                    if (!cost || !sale) return <span style={{ color: T.txtS, fontSize: 11 }}>—</span>;
                    const pct = ((sale - cost) / cost) * 100;
                    const col = pct < 0 ? T.red : pct < 30 ? T.amber : T.grn;
                    return <span style={{ fontSize: 11, fontWeight: 700, color: col }}>{pct.toFixed(0)}%</span>;
                  })()}
                </div>

                {/* Remover */}
                <button onClick={() => removeItem(item.ref)} style={{ background: "none", color: T.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Ic n="trash" s={14} c={T.red} />
                </button>
              </div>
            ))}

            {/* Footer totals */}
            <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.bdrBr}`, background: T.sur, display: "grid", gridTemplateColumns: "1fr 80px 110px 110px 70px 32px", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.txtM }}>{items.length} produto(s)</span>
              <span style={{ textAlign: "center", fontSize: 12, color: T.txtM }}>{items.reduce((s, i) => s + i.qty, 0).toFixed(1)}</span>
              <span style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: T.red }}>{fmt(totalNota)}</span>
              <span style={{ textAlign: "right", fontSize: 14, fontWeight: 700, color: T.grn }}>{fmt(totalMarkup)}</span>
              <span /><span />
            </div>
          </div>
        )}
      </div>

      {/* ── Right: summary + confirm ── */}
      <div style={{ width: 300, background: T.sur, borderLeft: `1px solid ${T.bdr}`, display: "flex", flexDirection: "column", padding: 24, gap: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.txtM, marginBottom: 12 }}>RESUMO DA NOTA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Fornecedor", value: supplier || "—" },
              { label: "Nº Nota",    value: invoiceNo || "—" },
              { label: "Data",       value: invoiceDate ? new Date(invoiceDate + "T12:00:00").toLocaleDateString("pt-BR") : "—" },
              { label: "Produtos",   value: `${items.length} item(s)` },
              { label: "Qtd. Total", value: items.reduce((s, i) => s + i.qty, 0).toFixed(1) + " unidades" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: T.txtM }}>{r.label}</span>
                <span style={{ color: T.txt, fontWeight: 500, textAlign: "right", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}>
          {[
            { label: "Total de compra",     value: fmt(totalNota),              color: T.red,  size: 16 },
            { label: "Receita potencial",   value: fmt(totalMarkup),            color: T.grn,  size: 16 },
            { label: "Lucro bruto est.",    value: fmt(totalMarkup - totalNota), color: totalMarkup - totalNota >= 0 ? T.grn : T.red, size: 13 },
          ].map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: T.txtM }}>{r.label}</span>
              <span style={{ fontSize: r.size, fontWeight: 700, color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.txtM, marginBottom: 10 }}>💳 PAGAR COM</div>
          {accounts.map((acc) => {
            const sel = accountId === acc.id;
            return (
              <button
                key={acc.id}
                onClick={() => setAccountId(acc.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: T.radiusSm, marginBottom: 6, background: sel ? acc.color + "22" : T.card, border: sel ? `2px solid ${acc.color}` : `1px solid ${T.bdr}`, color: T.txt, textAlign: "left" }}
              >
                <span style={{ fontSize: 18 }}>{acc.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: sel ? 600 : 400 }}>{acc.name}</span>
                {sel && <Ic n="check" s={15} c={acc.color} />}
              </button>
            );
          })}
        </div>

        {totalNota > 0 && accountId && (
          <div style={{ background: T.red + "11", border: `1px solid ${T.red}33`, borderRadius: T.radiusSm, padding: "10px 12px", fontSize: 13 }}>
            <div style={{ color: T.txtM, marginBottom: 2 }}>Será debitado de</div>
            <div style={{ fontWeight: 700, color: T.red }}>
              {fmt(totalNota)} — {accounts.find((a) => a.id === accountId)?.name}
            </div>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <Btn onClick={handleConfirm} disabled={!canConfirm} full size="lg" style={{ justifyContent: "center" }}>
            <Ic n="check" s={18} c={canConfirm ? "#1a0e00" : "currentColor"} />
            Confirmar Entrada
          </Btn>
          {!canConfirm && items.length > 0 && (
            <p style={{ fontSize: 11, color: T.red, marginTop: 8, textAlign: "center" }}>
              Selecione a conta de pagamento
            </p>
          )}
          {items.length === 0 && (
            <p style={{ fontSize: 11, color: T.txtS, marginTop: 8, textAlign: "center" }}>
              Adicione ao menos um produto
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntradaNota;
