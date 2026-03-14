import T from "../theme/index.js";

const Badge = ({ children, color = T.amber }) => (
  <span
    style={{
      background: color + "22",
      color,
      border: `1px solid ${color}44`,
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 20,
    }}
  >
    {children}
  </span>
);

export default Badge;
