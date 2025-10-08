import type { ReactNode } from "react";

export type HeaderBarProps = {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
};

export default function HeaderBar({
  title,
  leftSlot,
  rightSlot,
}: HeaderBarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: leftSlot ? 8 : 0,
        }}
      >
        {leftSlot ? <div>{leftSlot}</div> : null}
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h1>
      </div>
      {rightSlot ? (
        <div style={{ display: "flex", gap: 8 }}>{rightSlot}</div>
      ) : null}
    </div>
  );
}