import React, { useMemo, useState, useEffect, useRef } from "react";
import type { CSSProperties, ChangeEvent } from "react";

import type { PresetRecord } from "../../../lib/presets";
import { btnDanger, btnPrimary, btnSecondary } from "../../../ui/buttons";

export type PresetsCardProps = {
  presets: PresetRecord[];
  selectedPresetId: string | null;
  onSelectPreset: (id: string) => void;

  name: string;
  onNameChange: (value: string) => void;

  onSave: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onSaveScenarioB?: () => void;
  canSave: boolean;
  isSavingPreset: boolean;
  loadingPresets: boolean;

  isDirty: boolean;
  onSaveChanges: () => void;
  isSavingChanges: boolean;
};

const FIELD_WIDTH = 400;
const FIELD_HEIGHT = 42; // ← één bron voor exacte hoogte
const FIELD_RADIUS = 10;
const ROW_WIDTH = FIELD_WIDTH + 8 + FIELD_HEIGHT; // veld + gap(8) + icoon

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  width: "100%",
  boxSizing: "border-box",
  margin: "0 0 20px 0",
};

const headingStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 8px",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
  display: "block",
};

const inputBase: CSSProperties = {
  height: FIELD_HEIGHT,
  lineHeight: `${FIELD_HEIGHT - 2}px`,
  padding: "0 12px",
  borderRadius: FIELD_RADIUS,
  border: "1px solid #e5e7eb",
  width: FIELD_WIDTH,
  maxWidth: "unset",
  boxSizing: "border-box",
  appearance: "none" as any,
};


const iconBtnBase: CSSProperties = {
  width: FIELD_HEIGHT,
  height: FIELD_HEIGHT,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: FIELD_RADIUS,
  border: "1px solid #e5e7eb",
  padding: 0,
  cursor: "pointer",
};

const line: CSSProperties = {
  display: "grid",
  gap: 6, // label -> controlrow
};

const controlRow: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  width: ROW_WIDTH,           // ← fixeert totale rijbreedte
};

export default function PresetsCard({
  presets,
  selectedPresetId,
  onSelectPreset,
  name,
  onNameChange,
  onSave,
  onReset,
  onDelete,
  onSaveScenarioB,
  canSave,
  isSavingPreset,
  loadingPresets,
  isDirty,
  onSaveChanges,
  isSavingChanges,
}: PresetsCardProps): JSX.Element {
  const [localName, setLocalName] = useState<string>(name ?? "");
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement | null>(null);
const menuButtonRef = useRef<HTMLButtonElement | null>(null);

useEffect(() => {
  if (!menuOpen) return;

  const handleClickOutside = (ev: MouseEvent) => {
    const target = ev.target as Node;
    const inMenu = menuRef.current?.contains(target);
    const inButton = menuButtonRef.current?.contains(target);
    if (!inMenu && !inButton) {
      setMenuOpen(false);
    }
  };

  const handleEsc = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") setMenuOpen(false);
  };

  document.addEventListener("mousedown", handleClickOutside, true);
  document.addEventListener("keydown", handleEsc, true);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside, true);
    document.removeEventListener("keydown", handleEsc, true);
  };
}, [menuOpen]);

  const presetValue = selectedPresetId ?? "";

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const v = event.target.value;
    setLocalName(v);
    onNameChange(v);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectPreset(event.target.value);
  };

  const canShowSave = useMemo(
    () => (localName?.trim().length ?? 0) >= 3,
    [localName]
  );
  const canClickSave = canShowSave && canSave && !isSavingPreset;

  return (
    <div className="card" data-id="presets-card" style={cardStyle}>
      <h2 style={headingStyle}>Presets</h2>

      <div style={{ display: "grid", gap: 12 }}>
        {/* REGEL 1: Naam + Save-icoon (exact gelijke hoogte) */}
        <div style={line}>
          <label style={labelStyle}>Naam</label>
          <div style={controlRow}>
            <input
              style={{ ...inputBase, width: FIELD_WIDTH }}
              placeholder="Bijv. Klant X – Q4"
              value={localName}
              onChange={handleNameChange}
            />
            <button
              onClick={onSave}
              aria-label="Opslaan"
              title="Opslaan"
              disabled={!canClickSave}
              style={{
                ...iconBtnBase,
                ...btnPrimary,
                opacity: canShowSave ? 1 : 0.35,
                cursor: canClickSave ? "pointer" : "not-allowed",
                background: canClickSave ? "#111827" : "#9ca3af",
                color: "#fff",
              }}
            >
              {/* diskette-icoon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 4v6h8V4" stroke="currentColor" strokeWidth="2"/>
                <rect x="7" y="14" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>

            {onReset ? (
              <button onClick={onReset} style={{ ...btnSecondary, height: FIELD_HEIGHT }}>
                Reset
              </button>
            ) : null}
          </div>
        </div>

        {/* REGEL 2: Gekozen preset + Hamburgermenu (exact gelijke hoogte) */}
        <div style={line}>
          <label style={labelStyle}>
            Gekozen preset {loadingPresets ? "(laden…)" : ""}
          </label>
          <div style={controlRow}>
<select
  style={{ ...inputBase, width: FIELD_WIDTH }}
  value={presetValue}
  onChange={handleSelectChange}
>
              <option value="">— kies preset —</option>
              {presets.map((preset) => (
                <option key={preset.id ?? preset.name} value={preset.id ?? preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>

<div style={{ position: "relative", width: FIELD_HEIGHT }}>
    <button
  ref={menuButtonRef}
  aria-haspopup="menu"
  aria-expanded={menuOpen}
  onClick={(e) => {
    e.stopPropagation();
    setMenuOpen((s) => !s);
  }}
  style={{ ...iconBtnBase, ...btnSecondary }}
  title="Meer acties"
>
  ⋮
</button>

              {menuOpen && (
  <div
    ref={menuRef}
    role="menu"
    style={{
                    position: "absolute",
                    zIndex: 10,
                    right: 0,
                    marginTop: 6,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: FIELD_RADIUS,
                    boxShadow: "0 8px 24px rgba(0,0,0,.08)",
                    minWidth: 200,
                    overflow: "hidden",
                  }}
                >
                  <button
  role="menuitem"
  onClick={() => {
    setMenuOpen(false);
    onSaveChanges();
  }}
  disabled={!isDirty || isSavingChanges}
  aria-busy={isSavingChanges}
  style={{
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    background: "transparent",
    border: "none",
    cursor: !isDirty || isSavingChanges ? "not-allowed" : "pointer",
    opacity: !isDirty || isSavingChanges ? 0.6 : 1,
    fontWeight: 600,
  }}
>
  Wijzigingen opslaan
</button>
                  {onSaveScenarioB && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onSaveScenarioB();
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Bewaar scenario B
                    </button>
                  )}
                  {onDelete && (
                    <button
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete();
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#b91c1c",
                      }}
                    >
                      Verwijderen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Wijzigingen-cta */}
              </div>
    </div>
  );
}
