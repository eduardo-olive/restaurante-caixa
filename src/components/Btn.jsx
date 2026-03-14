import T from "../theme/index.js";

const Btn = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  full = false,
  style = {},
}) => {
  const variants = {
    primary: { background: T.amber, color: "#1a0e00" },
    ghost:   { background: "transparent", color: T.txt, border: `1px solid ${T.bdr}` },
    danger:  { background: T.redDim, color: "#fff" },
    success: { background: T.grnDim, color: "#fff" },
    outline: { background: "transparent", color: T.amber, border: `1px solid ${T.amber}` },
  };
  const sizes = {
    sm: { padding: "6px 12px",  fontSize: "12px", borderRadius: T.radiusSm },
    md: { padding: "10px 18px", fontSize: "14px", borderRadius: T.radius },
    lg: { padding: "13px 24px", fontSize: "15px", borderRadius: T.radius, fontWeight: 600 },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        ...variants[variant],
        ...sizes[size],
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontWeight: 500,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto",
        justifyContent: full ? "center" : "flex-start",
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default Btn;
