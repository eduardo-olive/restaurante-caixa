import { useState } from "react";
import T from "../theme/index.js";
import Ic from "../components/Ic.jsx";

// ─── Relatórios ──────────────────────────────────────────────────────────────
const loadJsPDF = () => new Promise((resolve, reject) => {
  if (window.jspdf) { resolve(window.jspdf); return; }
  const s1 = document.createElement("script");
  s1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  s1.onload = () => {
    const s2 = document.createElement("script");
    s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
    s2.onload = () => resolve(window.jspdf);
    s2.onerror = reject;
    document.head.appendChild(s2);
  };
  s1.onerror = reject;
  document.head.appendChild(s1);
});

const PDF_COLORS = {
  headerBg: [13, 74, 29],   // verde escuro
  headerText: [255, 255, 255],
  subHeaderBg: [240, 248, 241],
  subHeaderText: [13, 74, 29],
  rowAlt: [249, 253, 250],
  rowNorm: [255, 255, 255],
  border: [200, 230, 205],
  textDark: [30, 30, 30],
  textMid: [80, 80, 80],
  textLight: [140, 140, 140],
  amber: [180, 120, 20],
  red: [180, 50, 50],
  green: [20, 130, 50],
};

function pdfHeader(doc, title, subtitle) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(0, 0, W, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.headerText);
  doc.text("🍽️ Restaurante Caixa", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 20);
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textLight);
  doc.text(subtitle, 14, 26);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, W - 14, 26, { align: "right" });
  return 36; // y after header
}

function pdfSectionTitle(doc, text, y) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_COLORS.subHeaderBg);
  doc.rect(10, y - 4, W - 20, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.subHeaderText);
  doc.text(text.toUpperCase(), 14, y + 1);
  return y + 10;
}

function pdfFooter(doc) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...PDF_COLORS.headerBg);
    doc.rect(0, H - 10, W, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.headerText);
    doc.text("Restaurante Caixa — Sistema de Controle Financeiro", 14, H - 3);
    doc.text(`Página ${i} / ${pages}`, W - 14, H - 3, { align: "right" });
  }
}

const Relatorios = ({ orders, accounts, purchases, stock, shoppingList }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(null);

  const run = async (fn) => {
    setLoading(fn.name);
    try {
      const jspdf = await loadJsPDF();
      const { jsPDF } = jspdf;
      await fn(jsPDF);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar PDF: " + e.message);
    } finally {
      setLoading(null);
    }
  };

  // ── 1. Relatório de Caixa ──────────────────────────────────────────────────
  async function gerarRelatorioCaixa(jsPDF) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const from = new Date(dateFrom + "T00:00:00");
    const to   = new Date(dateTo   + "T23:59:59");

    const closed = orders
      .filter(o => o.status === "fechada" && new Date(o.closedAt) >= from && new Date(o.closedAt) <= to)
      .sort((a, b) => new Date(a.closedAt) - new Date(b.closedAt));

    const fmtR = n => "R$ " + Number(n).toFixed(2).replace(".", ",");
    const fmtDR = s => new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

    let y = pdfHeader(doc, "Relatório de Caixa — Vendas", `Período: ${from.toLocaleDateString("pt-BR")} a ${to.toLocaleDateString("pt-BR")}`);

    // Totais por conta
    y = pdfSectionTitle(doc, "Resumo por Forma de Pagamento", y);
    const byAcc = {};
    accounts.forEach(a => { byAcc[a.id] = { name: a.name, icon: a.icon, total: 0, count: 0 }; });
    closed.forEach(o => { if (byAcc[o.accountId]) { byAcc[o.accountId].total += o.total; byAcc[o.accountId].count++; } });
    const grandTotal = closed.reduce((s, o) => s + o.total, 0);

    doc.autoTable({
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Forma de Pagamento", "Qtd. Comandas", "Total"]],
      body: [
        ...accounts.map(a => [a.name, byAcc[a.id]?.count || 0, fmtR(byAcc[a.id]?.total || 0)]),
        ["TOTAL GERAL", closed.length, fmtR(grandTotal)],
      ],
      headStyles: { fillColor: PDF_COLORS.headerBg, textColor: PDF_COLORS.headerText, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
      styles: { cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: "center" }, 2: { halign: "right", fontStyle: "bold" } },
      didParseCell: (data) => {
        if (data.row.index === accounts.length) {
          data.cell.styles.fillColor = PDF_COLORS.subHeaderBg;
          data.cell.styles.textColor = PDF_COLORS.subHeaderText;
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    y = doc.lastAutoTable.finalY + 10;

    // Listagem detalhada
    if (closed.length === 0) {
      doc.setFontSize(10); doc.setTextColor(...PDF_COLORS.textMid);
      doc.text("Nenhuma venda no período selecionado.", 14, y + 6);
    } else {
      y = pdfSectionTitle(doc, `Detalhamento de Vendas (${closed.length} comandas)`, y);
      doc.autoTable({
        startY: y,
        margin: { left: 10, right: 10 },
        head: [["Data/Hora", "Mesa", "Cliente", "Atendente", "Itens", "Pagamento", "Total"]],
        body: closed.map(o => {
          const acc = accounts.find(a => a.id === o.accountId);
          return [
            fmtDR(o.closedAt || o.createdAt),
            o.table,
            o.clientName || "—",
            o.attendantName,
            o.items.map(i => `${i.qty}x ${i.name}`).join(", "),
            acc?.name || "—",
            fmtR(o.total),
          ];
        }),
        headStyles: { fillColor: PDF_COLORS.headerBg, textColor: PDF_COLORS.headerText, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 7.5 },
        alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
        styles: { cellPadding: 2, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 24 }, 1: { cellWidth: 14 }, 2: { cellWidth: 24 },
          3: { cellWidth: 24 }, 4: { cellWidth: 50, fontSize: 6.5 },
          5: { cellWidth: 22 }, 6: { halign: "right", fontStyle: "bold", cellWidth: 22 },
        },
      });
    }

    pdfFooter(doc);
    doc.save(`relatorio_caixa_${dateFrom}_${dateTo}.pdf`);
  }

  // ── 2. Lista de Compras PDF ────────────────────────────────────────────────
  async function gerarListaCompras(jsPDF) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const fmtR = n => "R$ " + Number(n).toFixed(2).replace(".", ",");
    const autoItems = stock.filter(s => s.qty < s.minQty);
    const needQty = s => Math.ceil(s.minQty * 2 - s.qty);

    let y = pdfHeader(doc, "Lista de Compras", `Gerada automaticamente a partir do estoque — ${new Date().toLocaleDateString("pt-BR")}`);

    // KPIs
    const totalEst = autoItems.reduce((sum, s) => sum + needQty(s) * s.cost, 0);
    const totalExtra = shoppingList.reduce((sum, e) => sum + e.qty * (e.cost || 0), 0);

    doc.autoTable({
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Itens Automáticos", "Itens Extras", "Custo Est. Estoque", "Custo Est. Extras", "TOTAL ESTIMADO"]],
      body: [[autoItems.length, shoppingList.length, fmtR(totalEst), fmtR(totalExtra), fmtR(totalEst + totalExtra)]],
      headStyles: { fillColor: PDF_COLORS.headerBg, textColor: PDF_COLORS.headerText, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 9, fontStyle: "bold", halign: "center" },
      styles: { cellPadding: 3 },
    });

    y = doc.lastAutoTable.finalY + 8;

    // Itens automáticos por categoria
    if (autoItems.length > 0) {
      y = pdfSectionTitle(doc, `Itens Abaixo do Estoque Mínimo (${autoItems.length})`, y);
      const grouped = {};
      autoItems.forEach(s => { (grouped[s.category] = grouped[s.category] || []).push(s); });

      for (const [cat, items] of Object.entries(grouped)) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...PDF_COLORS.subHeaderText);
        doc.text(cat.toUpperCase(), 14, y); y += 4;

        doc.autoTable({
          startY: y,
          margin: { left: 10, right: 10 },
          head: [["Produto", "Fornecedor", "Qtd. Atual", "Mín.", "Comprar", "Custo Unit.", "Custo Est.", "Urgência"]],
          body: items
            .sort((a, b) => (a.qty / a.minQty) - (b.qty / b.minQty))
            .map(s => {
              const need = needQty(s);
              const urg = s.qty === 0 ? "SEM ESTOQUE" : s.qty / s.minQty <= 0.3 ? "URGENTE" : s.qty / s.minQty <= 0.7 ? "CRÍTICO" : "BAIXO";
              return [s.name, s.supplier || "—", `${s.qty} ${s.unit}`, `${s.minQty} ${s.unit}`, `${need} ${s.unit}`, fmtR(s.cost), fmtR(need * s.cost), urg];
            }),
          headStyles: { fillColor: [40, 100, 60], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
          bodyStyles: { fontSize: 7.5 },
          alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
          styles: { cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 35 }, 1: { cellWidth: 30 }, 2: { halign: "center" },
            3: { halign: "center" }, 4: { halign: "center", fontStyle: "bold" },
            5: { halign: "right" }, 6: { halign: "right", fontStyle: "bold" }, 7: { halign: "center", fontStyle: "bold" },
          },
          didParseCell: (data) => {
            if (data.column.index === 7 && data.section === "body") {
              const v = data.cell.raw;
              if (v === "SEM ESTOQUE") data.cell.styles.textColor = [180, 40, 40];
              else if (v === "URGENTE") data.cell.styles.textColor = [180, 40, 40];
              else if (v === "CRÍTICO") data.cell.styles.textColor = [200, 100, 0];
              else data.cell.styles.textColor = [150, 100, 0];
            }
          },
        });
        y = doc.lastAutoTable.finalY + 4;
      }
    }

    // Itens extras
    if (shoppingList.length > 0) {
      y = pdfSectionTitle(doc, `Itens Extras Manuais (${shoppingList.length})`, y);
      doc.autoTable({
        startY: y,
        margin: { left: 10, right: 10 },
        head: [["Produto", "Fornecedor", "Quantidade", "Custo Est.", "Total Est."]],
        body: shoppingList.map(e => [e.name, e.supplier || "—", `${e.qty} ${e.unit}`, fmtR(e.cost || 0), fmtR(e.qty * (e.cost || 0))]),
        headStyles: { fillColor: PDF_COLORS.headerBg, textColor: PDF_COLORS.headerText, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
        styles: { cellPadding: 2 },
        columnStyles: { 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    // Total geral
    doc.setFillColor(...PDF_COLORS.subHeaderBg);
    doc.rect(10, y, doc.internal.pageSize.getWidth() - 20, 10, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...PDF_COLORS.subHeaderText);
    doc.text("TOTAL GERAL ESTIMADO", 14, y + 7);
    doc.setTextColor(...PDF_COLORS.amber);
    doc.text(fmtR(totalEst + totalExtra), doc.internal.pageSize.getWidth() - 14, y + 7, { align: "right" });

    pdfFooter(doc);
    doc.save(`lista_compras_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ── 3. Resumo de Caixa PDF ─────────────────────────────────────────────────
  async function gerarResumoCaixa(jsPDF) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const fmtR = n => "R$ " + Number(n).toFixed(2).replace(".", ",");
    const fmtDR = s => new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

    const calcSales = accId => orders.filter(o => o.status === "fechada" && o.accountId === accId).reduce((s, o) => s + o.total, 0);
    const calcPurchases = accId => purchases.filter(p => p.accountId === accId).reduce((s, p) => s + p.amount, 0);
    const calcBalance = acc => (acc.initialBalance || 0) + calcSales(acc.id) - calcPurchases(acc.id);

    let y = pdfHeader(doc, "Resumo de Caixa", `Posição atual em ${new Date().toLocaleString("pt-BR")}`);

    // Saldo total
    const saldoTotal = accounts.reduce((s, a) => s + calcBalance(a), 0);
    const totalVendas = orders.filter(o => o.status === "fechada").reduce((s, o) => s + o.total, 0);
    const totalCompras = purchases.reduce((s, p) => s + p.amount, 0);

    doc.autoTable({
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["SALDO TOTAL", "TOTAL VENDAS", "TOTAL COMPRAS", "RESULTADO"]],
      body: [[fmtR(saldoTotal), fmtR(totalVendas), fmtR(totalCompras), fmtR(totalVendas - totalCompras)]],
      headStyles: { fillColor: PDF_COLORS.headerBg, textColor: PDF_COLORS.headerText, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 11, fontStyle: "bold", halign: "center" },
      styles: { cellPadding: 4 },
      didParseCell: (data) => {
        if (data.section === "body") {
          const v = parseFloat(data.cell.raw.replace(/[^\d,-]/g, "").replace(",", "."));
          if (data.column.index === 3) {
            data.cell.styles.textColor = v >= 0 ? PDF_COLORS.green : PDF_COLORS.red;
          } else if (data.column.index === 0) {
            data.cell.styles.textColor = saldoTotal >= 0 ? PDF_COLORS.green : PDF_COLORS.red;
          }
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;
    y = pdfSectionTitle(doc, "Posição por Conta", y);

    doc.autoTable({
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Conta", "Saldo Inicial", "+ Vendas", "− Compras", "SALDO ATUAL"]],
      body: accounts.map(acc => {
        const b = calcBalance(acc);
        return [acc.name, fmtR(acc.initialBalance || 0), fmtR(calcSales(acc.id)), fmtR(calcPurchases(acc.id)), fmtR(b)];
      }),
      headStyles: { fillColor: PDF_COLORS.headerBg, textColor: PDF_COLORS.headerText, fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
      styles: { cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === "body") {
          const b = calcBalance(accounts[data.row.index]);
          data.cell.styles.textColor = b >= 0 ? PDF_COLORS.green : PDF_COLORS.red;
        }
      },
    });

    y = doc.lastAutoTable.finalY + 8;
    y = pdfSectionTitle(doc, "Últimas Movimentações de Saída", y);

    const recentPurchases = [...purchases].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
    if (recentPurchases.length === 0) {
      doc.setFontSize(9); doc.setTextColor(...PDF_COLORS.textMid);
      doc.text("Nenhuma saída registrada.", 14, y + 4);
    } else {
      doc.autoTable({
        startY: y,
        margin: { left: 10, right: 10 },
        head: [["Data/Hora", "Conta", "Descrição", "Valor"]],
        body: recentPurchases.map(p => {
          const acc = accounts.find(a => a.id === p.accountId);
          return [fmtDR(p.createdAt), acc?.name || "—", p.description, fmtR(p.amount)];
        }),
        headStyles: { fillColor: PDF_COLORS.headerBg, textColor: PDF_COLORS.headerText, fontStyle: "bold", fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: PDF_COLORS.rowAlt },
        styles: { cellPadding: 2, overflow: "linebreak" },
        columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 30 }, 2: { cellWidth: 90 }, 3: { halign: "right", fontStyle: "bold", textColor: PDF_COLORS.red } },
      });
    }

    pdfFooter(doc);
    doc.save(`resumo_caixa_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const reports = [
    {
      id: "caixa",
      icon: "💰",
      title: "Relatório de Caixa",
      desc: "Vendas detalhadas por período com totais por forma de pagamento e listagem completa de comandas fechadas.",
      color: T.amber,
      fn: gerarRelatorioCaixa,
      hasDateFilter: true,
    },
    {
      id: "compras",
      icon: "🛒",
      title: "Lista de Compras",
      desc: "Itens abaixo do estoque mínimo agrupados por categoria com quantidades sugeridas, fornecedores e custo estimado.",
      color: T.pur,
      fn: gerarListaCompras,
    },
    {
      id: "resumo",
      icon: "🏦",
      title: "Resumo de Caixa",
      desc: "Posição atual de todas as contas com saldo inicial, vendas, compras e últimas movimentações de saída.",
      color: T.grn,
      fn: gerarResumoCaixa,
    },
  ];

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Relatórios</h2>
        <p style={{ color: T.txtM, fontSize: 14, marginTop: 4 }}>Gere relatórios em PDF para impressão ou arquivo</p>
      </div>

      {/* Filtro de período (compartilhado pelo relatório de caixa) */}
      <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, padding: 18, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.txtM, marginBottom: 12 }}>
          PERÍODO — RELATÓRIO DE CAIXA
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: T.txtM, display: "block", marginBottom: 5 }}>DE</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, color: T.txtM, display: "block", marginBottom: 5 }}>ATÉ</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Hoje", fn: () => { const d = new Date().toISOString().slice(0,10); setDateFrom(d); setDateTo(d); } },
              { label: "Esta semana", fn: () => { const n = new Date(); const mon = new Date(n); mon.setDate(n.getDate() - n.getDay() + 1); setDateFrom(mon.toISOString().slice(0,10)); setDateTo(n.toISOString().slice(0,10)); } },
              { label: "Este mês", fn: () => { const n = new Date(); setDateFrom(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0,10)); setDateTo(n.toISOString().slice(0,10)); } },
            ].map(q => (
              <button key={q.label} onClick={q.fn}
                style={{ padding: "8px 14px", borderRadius: T.radiusSm, background: T.card, border: `1px solid ${T.bdrBr}`, color: T.txtM, fontSize: 12, fontWeight: 500 }}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {reports.map(r => (
          <div key={r.id} style={{ background: T.card, border: `1px solid ${r.color}33`, borderRadius: T.radius, padding: 20, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 32, lineHeight: 1 }}>{r.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.txt, marginBottom: 6 }}>{r.title}</div>
                <p style={{ fontSize: 12, color: T.txtM, lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            </div>

            {/* Preview stats */}
            {r.id === "caixa" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Vendas no período", value: orders.filter(o => o.status === "fechada" && new Date(o.closedAt) >= new Date(dateFrom + "T00:00:00") && new Date(o.closedAt) <= new Date(dateTo + "T23:59:59")).length + " comandas" },
                  { label: "Total", value: "R$ " + orders.filter(o => o.status === "fechada" && new Date(o.closedAt) >= new Date(dateFrom + "T00:00:00") && new Date(o.closedAt) <= new Date(dateTo + "T23:59:59")).reduce((s, o) => s + o.total, 0).toFixed(2).replace(".", ",") },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: T.sur, borderRadius: T.radiusSm, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, color: T.txtS, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
            {r.id === "compras" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Itens automáticos", value: stock.filter(s => s.qty < s.minQty).length + " itens" },
                  { label: "Extras manuais", value: shoppingList.length + " itens" },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: T.sur, borderRadius: T.radiusSm, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, color: T.txtS, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}
            {r.id === "resumo" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Contas", value: accounts.length + " contas" },
                  { label: "Movimentações", value: purchases.length + " saídas" },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: T.sur, borderRadius: T.radiusSm, padding: "8px 10px" }}>
                    <div style={{ fontSize: 11, color: T.txtS, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => run(r.fn)}
              disabled={!!loading}
              style={{
                marginTop: "auto", width: "100%", padding: "11px 0",
                borderRadius: T.radiusSm, background: loading === r.fn.name ? T.card : r.color + "22",
                border: `1px solid ${r.color}55`, color: r.color,
                fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading && loading !== r.fn.name ? 0.5 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading === r.fn.name
                ? <><span style={{ width: 14, height: 14, border: `2px solid ${r.color}44`, borderTopColor: r.color, borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} /> Gerando PDF...</>
                : <><Ic n="print" s={15} c={r.color} /> Gerar PDF</>
              }
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Relatorios;
