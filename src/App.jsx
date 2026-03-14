import { useState, useEffect, useCallback } from "react";
import { auth as authApi, users as usersApi, accounts as accountsApi,
         products as productsApi, orders as ordersApi, stock as stockApi,
         purchases as purchasesApi, shopping as shoppingApi } from "./lib/api.js";
import { uid, fmt } from "./lib/helpers.js";
import T from "./theme/index.js";
import GlobalStyle from "./theme/GlobalStyle.jsx";
import Toast from "./components/Toast.jsx";
import Sidebar from "./components/Sidebar.jsx";

import LoginScreen     from "./screens/LoginScreen.jsx";
import Dashboard       from "./screens/Dashboard.jsx";
import NovaComanda     from "./screens/NovaComanda.jsx";
import ComandasAbertas from "./screens/ComandasAbertas.jsx";
import Contas          from "./screens/Contas.jsx";
import Historico       from "./screens/Historico.jsx";
import Estoque         from "./screens/Estoque.jsx";
import ListaCompras    from "./screens/ListaCompras.jsx";
import EntradaNota     from "./screens/EntradaNota.jsx";
import Produtos        from "./screens/Produtos.jsx";
import Usuarios        from "./screens/Usuarios.jsx";
import Relatorios      from "./screens/Relatorios.jsx";

export default function App() {
  const [loading,      setLoading]      = useState(true);
  const [user,         setUser]         = useState(null);
  const [view,         setView]         = useState("dashboard");
  const [users,        setUsers]        = useState([]);
  const [accounts,     setAccounts]     = useState([]);
  const [products,     setProducts]     = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [stockItems,   setStockItems]   = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [purchasesTx,  setPurchasesTx]  = useState([]);
  const [toast,        setToast]        = useState(null);
  const [editOrder,    setEditOrder]    = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    (async () => {
      if (authApi.isLoggedIn()) {
        try {
          const meRes = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${authApi.getToken()}` },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            setUser(me);
            const [u, a, p, o, s, sh, pu] = await Promise.all([
              usersApi.list().catch(() => []),
              accountsApi.list().catch(() => []),
              productsApi.list().catch(() => []),
              ordersApi.list().catch(() => []),
              stockApi.list().catch(() => []),
              shoppingApi.list().catch(() => []),
              purchasesApi.list().catch(() => []),
            ]);
            setUsers(u); setAccounts(a); setProducts(p); setOrders(o);
            setStockItems(s); setShoppingList(sh); setPurchasesTx(pu);
          } else {
            authApi.logout();
          }
        } catch { authApi.logout(); }
      }
      setLoading(false);
    })();
  }, []);

  const handleLogin = async (username, password) => {
    const me = await authApi.login(username, password);
    setUser(me);
    const [u, a, p, o, s, sh, pu] = await Promise.all([
      usersApi.list().catch(() => []),
      accountsApi.list().catch(() => []),
      productsApi.list().catch(() => []),
      ordersApi.list().catch(() => []),
      stockApi.list().catch(() => []),
      shoppingApi.list().catch(() => []),
      purchasesApi.list().catch(() => []),
    ]);
    setUsers(u); setAccounts(a); setProducts(p); setOrders(o);
    setStockItems(s); setShoppingList(sh); setPurchasesTx(pu);
    setView("dashboard");
  };

  const handleLogout = () => {
    authApi.logout();
    setUser(null); setView("dashboard");
    setUsers([]); setAccounts([]); setProducts([]); setOrders([]);
    setStockItems([]); setShoppingList([]); setPurchasesTx([]);
  };

  const isAdmin       = user && ["admin", "caixa"].includes(user.role);
  const openOrders    = orders.filter((o) => o.status === "aberta").length;
  const lowStockCount = stockItems.filter((s) => s.qty <= s.minQty).length;
  const shoppingCount = lowStockCount + shoppingList.length;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:T.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:`3px solid ${T.bdr}`, borderTopColor:T.amber, borderRadius:"50%", margin:"0 auto 16px", animation:"spin 0.8s linear infinite" }} />
        <p style={{ color:T.txtM, fontSize:14 }}>Conectando ao servidor...</p>
      </div>
    </div>
  );

  if (!user) return (
    <>
      <GlobalStyle />
      <LoginScreen onLogin={handleLogin} />
    </>
  );

  const renderView = () => {
    switch (view) {

      case "dashboard":
        return <Dashboard orders={orders} accounts={accounts} purchases={purchasesTx} user={user} setView={setView} />;

      case "comanda":
        return (
          <NovaComanda
            products={products} accounts={accounts} user={user}
            orders={orders} editOrder={editOrder}
            setView={(v) => { setEditOrder(null); setView(v); }}
            onSave={async (o) => {
              try {
                if (editOrder) {
                  const updated = await ordersApi.update(o.id, o);
                  setOrders(orders.map(x => x.id === updated.id ? updated : x));
                  showToast(o.status === "fechada" ? "Venda registrada!" : "Comanda atualizada!");
                } else {
                  const created = await ordersApi.create(o);
                  setOrders([...orders, created]);
                  showToast(o.status === "fechada" ? "Venda registrada!" : "Comanda salva!");
                }
                setEditOrder(null);
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      case "comandas":
        return (
          <ComandasAbertas
            orders={orders} accounts={accounts} setView={setView}
            onEdit={(order) => { setEditOrder(order); setView("comanda"); }}
            onClose={async (id, accId, payments) => {
              try {
                if (payments && payments.length > 1) {
                  // Split payment: update order with payments array
                  const order = orders.find(o => o.id === id);
                  const updated = await ordersApi.update(id, {
                    ...order, status: "fechada", accountId: accId,
                    payments, closedAt: new Date().toISOString(),
                  });
                  setOrders(orders.map(o => o.id === id ? updated : o));
                  showToast(`Comanda fechada! Dividida em ${payments.length} pagamentos`);
                } else {
                  const updated = await ordersApi.close(id, accId);
                  // Preserve payments array in local state
                  setOrders(orders.map(o => o.id === id ? { ...updated, payments } : o));
                  showToast("Comanda fechada!");
                }
              } catch (err) { showToast(err.message, "error"); }
            }}
            onDelete={async (id) => {
              try {
                await ordersApi.remove(id);
                setOrders(orders.filter(o => o.id !== id));
                showToast("Comanda cancelada", "info");
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      case "contas":
        return (
          <Contas
            accounts={accounts} orders={orders} purchases={purchasesTx} isAdmin={isAdmin}
            onAddAccount={async (a) => {
              try {
                const created = await accountsApi.create(a);
                setAccounts([...accounts, { ...created, initialBalance: created.initialBalance ?? 0 }]);
                showToast("Conta criada!");
              } catch (err) { showToast(err.message, "error"); }
            }}
            onDeleteAccount={async (id) => {
              try {
                await accountsApi.remove(id);
                setAccounts(accounts.filter(a => a.id !== id));
              } catch (err) { showToast(err.message, "error"); }
            }}
            onUpdateInitialBalance={async (id, val) => {
              try {
                await accountsApi.updateBalance(id, val);
                setAccounts(accounts.map(a => a.id === id ? { ...a, initialBalance: val } : a));
                showToast("Saldo inicial atualizado!");
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      case "historico":
        return <Historico orders={orders} accounts={accounts} />;

      case "estoque":
        if (!isAdmin) break;
        return (
          <Estoque
            stock={stockItems}
            onSave={async (s) => {
              try {
                if (stockItems.find(x => x.id === s.id)) {
                  const updated = await stockApi.update(s.id, s);
                  setStockItems(stockItems.map(x => x.id === s.id ? updated : x));
                  showToast("Estoque atualizado!");
                } else {
                  const created = await stockApi.create(s);
                  setStockItems([...stockItems, created]);
                  showToast("Item criado!");
                }
              } catch (err) { showToast(err.message, "error"); }
            }}
            onDelete={async (id) => {
              try {
                await stockApi.remove(id);
                setStockItems(stockItems.filter(s => s.id !== id));
              } catch (err) { showToast(err.message, "error"); }
            }}
            onAdjust={async (id, delta, type) => {
              try {
                const updated = await stockApi.adjust(id, delta, type, type === "ajuste" ? delta : undefined);
                setStockItems(stockItems.map(s => s.id === id ? updated : s));
                showToast(type === "entrada" ? "Entrada registrada!" : type === "saida" ? "Saída registrada!" : "Estoque ajustado!");
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      case "compras":
        if (!isAdmin) break;
        return (
          <ListaCompras
            stock={stockItems} extras={shoppingList} accounts={accounts}
            onSaveExtra={async (item) => {
              try {
                const created = await shoppingApi.create(item);
                setShoppingList([...shoppingList, created]);
              } catch (err) { showToast(err.message, "error"); }
            }}
            onDeleteExtra={async (id) => {
              try {
                await shoppingApi.remove(id);
                setShoppingList(shoppingList.filter(i => i.id !== id));
              } catch (err) { showToast(err.message, "error"); }
            }}
            onReceiveStock={async (s, qty, cost, accId, totalPaid) => {
              try {
                const updated = await stockApi.update(s.id, { ...s, qty: Math.round((s.qty + qty) * 100) / 100, cost });
                setStockItems(stockItems.map(x => x.id === s.id ? updated : x));
                const acc = accounts.find(a => a.id === accId);
                const tx = await purchasesApi.create({ id: uid(), accountId: accId, amount: totalPaid, description: `Compra: ${qty}${s.unit} de ${s.name}`, stockId: s.id });
                setPurchasesTx([...purchasesTx, tx]);
                showToast(`Estoque atualizado! ${acc?.name || ""} debitado ${fmt(totalPaid)}`);
              } catch (err) { showToast(err.message, "error"); }
            }}
            onReceiveExtra={async (item, qty, cost, accId, totalPaid) => {
              try {
                await shoppingApi.remove(item.id);
                setShoppingList(shoppingList.filter(i => i.id !== item.id));
                const acc = accounts.find(a => a.id === accId);
                const tx = await purchasesApi.create({ id: uid(), accountId: accId, amount: totalPaid, description: `Compra extra: ${item.name}` });
                setPurchasesTx([...purchasesTx, tx]);
                showToast(`Compra registrada! ${acc?.name || ""} debitado ${fmt(totalPaid)}`);
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      case "entrada":
        if (!isAdmin) break;
        return (
          <EntradaNota
            stock={stockItems} products={products} accounts={accounts} user={user}
            onConfirm={async ({ supplier, invoiceNo, invoiceDate, accountId, items, totalNota }) => {
              try {
                let updatedStock = [...stockItems];
                for (const item of items) {
                  const existing = updatedStock.find(s => s.id === item.ref);
                  if (existing) {
                    const upd = await stockApi.update(existing.id, { ...existing, qty: Math.round((existing.qty + item.qty) * 100) / 100, cost: item.costPrice });
                    updatedStock = updatedStock.map(s => s.id === existing.id ? upd : s);
                  } else {
                    const created = await stockApi.create({ id: uid(), name: item.name, category: item.category || "Geral", unit: item.unit, qty: item.qty, minQty: item.qty, cost: item.costPrice, supplier: supplier || "" });
                    updatedStock = [...updatedStock, created];
                  }
                  if (item.salePrice > 0 && item.ref.startsWith("prod_")) {
                    const prodId = item.ref.replace("prod_", "");
                    const prod = products.find(p => p.id === prodId);
                    if (prod) {
                      const updProd = await productsApi.update(prodId, { ...prod, price: item.salePrice });
                      setProducts(prev => prev.map(p => p.id === prodId ? updProd : p));
                    }
                  }
                }
                setStockItems(updatedStock);
                const acc = accounts.find(a => a.id === accountId);
                const desc = `NF${invoiceNo ? " " + invoiceNo : ""} — ${supplier || "Fornecedor"} (${items.length} item(s))`;
                const tx = await purchasesApi.create({ id: uid(), accountId, amount: totalNota, description: desc, invoiceNo, supplier, invoiceDate });
                setPurchasesTx(prev => [...prev, tx]);
                showToast(`Nota lançada! ${acc?.name || ""} debitado ${fmt(totalNota)}`);
                setView("estoque");
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      case "relatorios":
        if (!isAdmin) break;
        return (
          <Relatorios
            orders={orders} accounts={accounts}
            purchases={purchasesTx} stock={stockItems} shoppingList={shoppingList}
          />
        );

      case "produtos":
        if (!isAdmin) break;
        return (
          <Produtos
            products={products}
            onSave={async (p) => {
              try {
                if (products.find(x => x.id === p.id)) {
                  const updated = await productsApi.update(p.id, p);
                  setProducts(products.map(x => x.id === p.id ? updated : x));
                  showToast("Produto atualizado!");
                } else {
                  const created = await productsApi.create(p);
                  setProducts([...products, created]);
                  showToast("Produto criado!");
                }
              } catch (err) { showToast(err.message, "error"); }
            }}
            onDelete={async (id) => {
              try {
                await productsApi.remove(id);
                setProducts(products.filter(p => p.id !== id));
                showToast("Produto removido", "info");
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      case "usuarios":
        if (!isAdmin) break;
        return (
          <Usuarios
            users={users} currentUser={user}
            onSave={async (u) => {
              try {
                if (users.find(x => x.id === u.id)) {
                  const updated = await usersApi.update(u.id, u);
                  setUsers(users.map(x => x.id === u.id ? updated : x));
                  showToast("Usuário atualizado!");
                } else {
                  const created = await usersApi.create(u);
                  setUsers([...users, created]);
                  showToast("Usuário criado!");
                }
              } catch (err) { showToast(err.message, "error"); }
            }}
            onToggle={async (id) => {
              try {
                const updated = await usersApi.toggle(id);
                setUsers(users.map(u => u.id === id ? updated : u));
                showToast("Usuário atualizado");
              } catch (err) { showToast(err.message, "error"); }
            }}
          />
        );

      default: break;
    }
    return <Dashboard orders={orders} accounts={accounts} purchases={purchasesTx} user={user} setView={setView} />;
  };

  return (
    <>
      <GlobalStyle />
      <div style={{ display:"flex", minHeight:"100vh", background:T.bg }}>
        <Sidebar
          user={user} view={view} setView={setView}
          openOrders={openOrders} lowStockCount={lowStockCount} shoppingCount={shoppingCount}
          onLogout={handleLogout}
        />
        <div style={{ flex:1, overflowY:"auto", minHeight:"100vh" }}>
          {renderView()}
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  );
}
