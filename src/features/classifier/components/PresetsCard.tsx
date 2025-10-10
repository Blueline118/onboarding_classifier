import React, { useEffect, useMemo, useState } from "react";
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
  canSave: boolean;
  isSavingPreset: boolean;
  loadingPresets: boolean;
  onApply: () => void;
  onDelete?: () => void;
  onRefresh: () => void;
  isDirty: boolean;
  onSaveChanges: () => void;
  isSavingChanges: boolean;
};

const sectionStyle: CSSProperties = { marginBottom: 24 };
const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};
const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
  display: "block",
};
const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};
const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};
const headingStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 8px",
};

export default function PresetsCard({
  presets,
  selectedPresetId,
  onSelectPreset,
  name,
  onNameChange,
  onSave,
  canSave,
  isSavingPreset,
  loadingPresets,
  onApply,
  onDelete,
  onRefresh,
  isDirty,
  onSaveChanges,
  isSavingChanges,
}: PresetsCardProps): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [localName, setLocalName] = useState(name);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalName(name);
  }, [name]);

  useEffect(() => {
    if (localName !== name) {
      onNameChange(localName);
    }
  }, [localName, name, onNameChange]);

  const disableApply = useMemo(() => !selectedPresetId, [selectedPresetId]);
  const presetValue = useMemo(() => selectedPresetId ?? "", [selectedPresetId]);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setLocalName(event.target.value);
  };

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelectPreset(event.target.value);
  };

  return (
    <div
      className="card"
      data-mounted={mounted}
      data-id="presets-card"
      style={{ ...cardStyle, ...sectionStyle }}
    >
      <h2 style={headingStyle}>Presets</h2>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>Naam</label>
          <input
            style={inputStyle}
            placeholder="Bijv. Klant X – Q4"
            value={localName}
            onChange={handleNameChange}
          />
          <button
            onClick={onSave}
            disabled={!canSave || isSavingPreset}
            aria-busy={isSavingPreset}
            style={{
              ...btnPrimary,
              marginTop: 8,
              background: !canSave ? "#9ca3af" : "#111827",
              cursor: !canSave || isSavingPreset ? "not-allowed" : "pointer",
              opacity: isSavingPreset ? 0.85 : 1,
            }}
          >
            {isSavingPreset ? "Bezig..." : "Opslaan"}
          </button>
        </div>

        <div>
          <label style={labelStyle}>
            Gekozen preset {loadingPresets ? "(laden…)" : ""}
          </label>
          <select style={inputStyle} value={presetValue} onChange={handleSelectChange}>
            <option value="">— kies preset —</option>
            {presets.map((preset) => (
              <option key={preset.id ?? preset.name} value={preset.id ?? preset.name}>
                {preset.name}
              </option>
            ))}
          </select>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 8,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onApply}
                disabled={disableApply}
                style={{
                  ...btnPrimary,
                  background: "#2563eb",
                  cursor: disableApply ? "not-allowed" : "pointer",
                }}
              >
                Toepassen
              </button>
              {onDelete ? (
                <button
                  onClick={onDelete}
                  disabled={disableApply}
                  style={{
                    ...btnDanger,
                    cursor: disableApply ? "not-allowed" : "pointer",
                  }}
                >
                  Verwijderen
                </button>
              ) : null}
              <button onClick={onRefresh} style={{ ...btnSecondary }}>
                Vernieuwen
              </button>
            </div>
              {isDirty ? (
              <button
                onClick={onSaveChanges}
                disabled={isSavingChanges}
                aria-busy={isSavingChanges}
                style={{
                  ...btnPrimary,
                  cursor: isSavingChanges ? "wait" : "pointer",
                  opacity: isSavingChanges ? 0.85 : 1,
                }}
              >
                {isSavingChanges ? "Bezig..." : "Wijzigingen opslaan"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
