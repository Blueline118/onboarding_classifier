import type React from "react";

const base: React.CSSProperties = {
padding: "10px 14px",
borderRadius: 10,
border: "1px solid transparent",
fontWeight: 600,
fontSize: 14,
lineHeight: "20px",
cursor: "pointer",
transition: "box-shadow .15s ease, transform .02s ease, background .15s ease",
};

export const btnPrimary: React.CSSProperties = {
...base,
background: "var(--brand-blue)",
color: "#fff",
boxShadow: "0 8px 16px rgba(21,101,255,0.20)",
};

export const btnSecondary: React.CSSProperties = {
...base,
background: "#fff",
color: "var(--brand-navy)",
border: "1px solid var(--border)",
};

export const btnDanger: React.CSSProperties = {
...base,
background: "#ef4444",
color: "#fff",
};

export const btnGhost: React.CSSProperties = {
...base,
background: "transparent",
color: "var(--brand-navy)",
border: "1px solid var(--border)",
};

export const pressable = (busy?: boolean): React.CSSProperties => ({
opacity: busy ? 0.85 : 1,
transform: busy ? "scale(0.998)" : "none",
});