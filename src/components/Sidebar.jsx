import T from "../theme/index.js";
import Ic from "./Ic.jsx";

const Sidebar = ({ user, view, setView, onLogout, openOrders, lowStockCount, shoppingCount }) => {
  const isAdmin = ["admin", "caixa"].includes(user.role);

  const nav = [
    { id: "dashboard", label: "Início",           icon: "home" },
    { id: "comanda",   label: "Nova Comanda",     icon: "plus" },
    { id: "comandas",  label: "Comandas",         icon: "receipt", badge: openOrders },
    { id: "contas",    label: "Contas",           icon: "wallet" },
    { id: "historico", label: "Histórico",        icon: "chart" },
    { id: "estoque",   label: "Estoque",          icon: "box",  badge: lowStockCount || 0, badgeColor: lowStockCount > 0 ? T.red : null },
    { id: "compras",   label: "Lista de Compras", icon: "cart", badge: shoppingCount || 0, badgeColor: T.pur },
    ...(isAdmin
      ? [
          { id: "entrada",  label: "Entrada de Nota", icon: "nota" },
          { id: "produtos", label: "Produtos",         icon: "tag" },
          { id: "usuarios", label: "Usuários",         icon: "users" },
        ]
      : []),
  ];

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: T.sur,
        borderRight: `1px solid ${T.bdr}`,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${T.bdr}` }}>
        <div style={{ fontSize: 22, marginBottom: 2 }}>🍽️</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.txt }}>Restaurante Caixa</div>
        <div style={{ fontSize: 12, color: T.txtM, marginTop: 2 }}>Sistema de Controle</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {nav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: T.radiusSm,
              background: view === n.id ? T.amber + "22" : "transparent",
              color: view === n.id ? T.amber : T.txtM,
              fontWeight: view === n.id ? 600 : 400,
              fontSize: 14,
              marginBottom: 2,
              textAlign: "left",
              border: view === n.id ? `1px solid ${T.amber}33` : "1px solid transparent",
              transition: "all .15s",
            }}
          >
            <Ic n={n.icon} s={17} c={view === n.id ? T.amber : T.txtM} />
            {n.label}
            {n.badge > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: n.badgeColor || T.amber,
                  color: n.badgeColor ? "#fff" : "#1a0e00",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 20,
                  padding: "1px 7px",
                }}
              >
                {n.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${T.bdr}` }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: T.amber + "33",
              color: T.amber,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {user.name[0].toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: T.txt,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.name}
            </div>
            <div style={{ fontSize: 11, color: T.txtM, textTransform: "capitalize" }}>{user.role}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: T.radiusSm,
            background: "transparent",
            color: T.red,
            fontSize: 13,
            border: `1px solid ${T.bdr}`,
          }}
        >
          <Ic n="logout" s={15} c={T.red} /> Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
