import type { CSSProperties } from "react";

const baseButton: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
};

export const btnPrimary: CSSProperties = {
  ...baseButton,
  background: "#111827",
  color: "#fff",
};

export const btnSecondary: CSSProperties = {
  ...baseButton,
  background: "#fff",
  color: "#111827",
};

export const btnDanger: CSSProperties = {
  ...baseButton,
  background: "#dc2626",
  color: "#fff",
  borderColor: "#dc2626",
};