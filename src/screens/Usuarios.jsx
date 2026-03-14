import { useState } from "react";
import T from "../theme/index.js";
import { uid } from "../lib/helpers.js";
import Ic from "../components/Ic.jsx";
import Btn from "../components/Btn.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";

const Usuarios = ({ users, currentUser, onSave, onToggle }) => {
  const [showNew, setShowNew] = useState(false);
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState("");
  const [un, setUn] = useState("");
  const [pw, setPw] = useState("");
  const [role, setRole] = useState("garcom");

  const roleColors = { admin: T.red, caixa: T.amber, garcom: T.grn };
  const roleLabel  = { admin: "Administrador", caixa: "Caixa", garcom: "Garçom" };

  const openEdit = (u) => {
    setEdit(u); setName(u.name); setUn(u.username); setPw(""); setRole(u.role); setShowNew(true);
  };
  const save = () => {
    if (!name || !un) return;
    if (!edit && !pw) { alert("Informe a senha"); return; }
    const u = edit
      ? { ...edit, name, username: un, role, ...(pw ? { password: pw } : {}) }
      : { id: uid(), name, username: un, password: pw, role, active: true };
    onSave(u);
    setShowNew(false); setEdit(null); setName(""); setUn(""); setPw(""); setRole("garcom");
  };

  return (
    <div style={{ padding: 28 }} className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Usuários</h2>
          <p style={{ color: T.txtM, fontSize: 14, marginTop: 4 }}>{users.length} usuário(s) cadastrado(s)</p>
        </div>
        <Btn onClick={() => { setEdit(null); setName(""); setUn(""); setPw(""); setRole("garcom"); setShowNew(true); }}>
          <Ic n="plus" s={16} c="#1a0e00" /> Novo Usuário
        </Btn>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.bdr}`, borderRadius: T.radius, overflow: "hidden" }}>
        {users.map((u, i) => (
          <div
            key={u.id}
            style={{
              display: "flex", alignItems: "center", padding: "14px 18px",
              borderBottom: i < users.length - 1 ? `1px solid ${T.bdr}` : "none",
              opacity: u.active ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: roleColors[u.role] + "22", color: roleColors[u.role],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, marginRight: 14, flexShrink: 0,
              }}
            >
              {u.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {u.name}{" "}
                {u.id === currentUser.id && (
                  <span style={{ color: T.txtM, fontWeight: 400, fontSize: 12 }}>(você)</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: T.txtM }}>@{u.username}</div>
            </div>
            <Badge color={roleColors[u.role]}>{roleLabel[u.role]}</Badge>
            <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
              <Btn onClick={() => openEdit(u)} variant="ghost" size="sm"><Ic n="edit" s={14} /></Btn>
              {u.id !== currentUser.id && (
                <Btn onClick={() => onToggle(u.id)} variant={u.active ? "danger" : "success"} size="sm">
                  {u.active ? "Desativar" : "Ativar"}
                </Btn>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNew && (
        <Modal title={edit ? "Editar Usuário" : "Novo Usuário"} onClose={() => { setShowNew(false); setEdit(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>NOME COMPLETO *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do funcionário" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>LOGIN *</label>
              <input value={un} onChange={(e) => setUn(e.target.value)} placeholder="usuario.login" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>
                {edit ? "NOVA SENHA (deixe em branco para manter)" : "SENHA *"}
              </label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: T.txtM, display: "block", marginBottom: 5 }}>PERFIL</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="garcom">Garçom</option>
                <option value="caixa">Caixa</option>
                <option value="admin">Administrador</option>
              </select>
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

export default Usuarios;
