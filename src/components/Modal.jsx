import T from "../theme/index.js";
import Ic from "./Ic.jsx";

const Modal = ({ title, children, onClose, width = 480 }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 20,
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div
      style={{
        background: T.sur,
        border: `1px solid ${T.bdrBr}`,
        borderRadius: T.radius,
        width: "100%",
        maxWidth: width,
        maxHeight: "90vh",
        overflow: "auto",
      }}
      className="fade-in"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${T.bdr}`,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            color: T.txtM,
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Ic n="x" s={18} />
        </button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

export default Modal;
