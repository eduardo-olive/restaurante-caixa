import { useState } from "react";
import T from "../theme/index.js";
import Ic from "../components/Ic.jsx";
import Btn from "../components/Btn.jsx";

const LoginScreen = ({ onLogin }) => {
  const [un, setUn] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!un || !pw) { setErr("Informe usuário e senha"); return; }
    setBusy(true);
    try {
      await onLogin(un, pw);
    } catch (e) {
      setErr(e.message || "Usuário ou senha inválidos");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at 50% 0%, #1a2e1a 0%, ${T.bg} 60%)`,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🍽️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.txt, letterSpacing: "-0.5px" }}>
            Restaurante Caixa
          </h1>
          <p style={{ color: T.txtM, fontSize: 14, marginTop: 6 }}>Sistema de Controle Financeiro</p>
        </div>

        <div
          style={{
            background: T.card,
            border: `1px solid ${T.bdrBr}`,
            borderRadius: T.radius,
            padding: 28,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.txtM, fontWeight: 500, display: "block", marginBottom: 6 }}>
              USUÁRIO
            </label>
            <input
              value={un}
              onChange={(e) => { setUn(e.target.value); setErr(""); }}
              placeholder="Digite seu usuário"
              onKeyDown={(e) => e.key === "Enter" && handle()}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: T.txtM, fontWeight: 500, display: "block", marginBottom: 6 }}>
              SENHA
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => { setPw(e.target.value); setErr(""); }}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handle()}
                style={{ paddingRight: 40 }}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  color: T.txtM,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Ic n="eye" s={16} />
              </button>
            </div>
          </div>
          {err && (
            <p style={{ color: T.red, fontSize: 13, marginBottom: 12, textAlign: "center" }}>{err}</p>
          )}
          <Btn onClick={handle} full size="lg" style={{ fontWeight: 700 }} disabled={busy}>
            <Ic n="lock" s={16} c="#1a0e00" /> {busy ? "Entrando..." : "Entrar"}
          </Btn>
        </div>
        <p style={{ textAlign: "center", color: T.txtS, fontSize: 12, marginTop: 16 }}>
          v2.0 — PostgreSQL + REST API
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
