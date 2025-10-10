import type { CSSProperties } from "react";
import type { PresetRecord } from "../../../lib/presets";
import { btnDanger, btnPrimary, btnSecondary } from "../../../ui/buttons";

/**
 * Props for {@link PresetsCard} supplied by the parent container.
 * - `presets` – lijst met beschikbare presets voor de dropdown.
 * - `selectedPresetId` – huidig gekozen preset-ID of `null` wanneer geen selectie.
 * - `onSelectPreset` – handler wanneer een andere preset gekozen wordt (ook "geen").
 * - `name` / `onNameChange` – gecontroleerde state voor het naamveld.
 * - `onSave`, `canSave`, `isSavingPreset` – acties/status voor een nieuwe preset.
 * - `loadingPresets` – vlag die aangeeft dat presets opgehaald worden.
 * - `onApply` – toepassen van de geselecteerde preset.
 * - `onDelete` – optionele verwijderactie voor de huidige preset.
 * - `onRefresh` – opnieuw laden van de presetslijst.
 * - `isDirty`, `onSaveChanges`, `isSavingChanges` – wijzigingsindicator en actie.
 */
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
}: PresetsCardProps) {
  const disableApply = !selectedPresetId;
  const presetValue = selectedPresetId ?? "";

  return (
    <div className="card" data-id="presets-card" style={{ ...cardStyle, ...sectionStyle }}>
      <h2 style={headingStyle}>Presets</h2>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle}>Naam</label>
          <input
            style={inputStyle}
            placeholder="Bijv. Klant X – Q4"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
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
          <select
            style={inputStyle}
            value={presetValue}
            onChange={(e) => onSelectPreset(e.target.value)}
          >
            <option value="">— kies preset —</option>
            {presets.map((p) => (
              <option key={p.id ?? p.name} value={p.id ?? p.name}>
                {p.name}
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
              {onDelete && (
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
              )}
              <button
                onClick={onRefresh}
                style={{
                  ...btnSecondary,
                }}
              >
                Vernieuwen
              </button>
            </div>
            {isDirty && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
