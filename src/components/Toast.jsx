import T from "../theme/index.js";

const Toast = ({ msg, type = "success" }) => {
  const colors = { success: T.grnDim, error: T.redDim, info: T.amber };
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 2000,
        background: colors[type],
        color: "#fff",
        padding: "12px 20px",
        borderRadius: T.radius,
        fontWeight: 500,
        fontSize: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      }}
      className="fade-in"
    >
      {msg}
    </div>
  );
};

export default Toast;
