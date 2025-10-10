// src/features/classifier/components/ResultPanel.tsx
// Volledig bestand – sluitende JSX en zelfvoorzienende styles

import React from "react";
import type { CSSProperties } from "react";
import type { ClassifierResult } from "../types";

export interface ResultPanelProps {
  result: ClassifierResult | null;
  isBusy?: boolean;
}

/* ================= Styles ================= */
const sectionStyle: CSSProperties = { marginBottom: 24 };
const cardStyle: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "var(--shadow)",
};
const headingStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 8px",
  color: "var(--brand-navy)",
};
const smallTextStyle: CSSProperties = { fontSize: 12, color: "var(--muted)" };
const listStyle: CSSProperties = { margin: 0, paddingLeft: 20 };
const busyStateStyle: CSSProperties = { opacity: 0.6 };

/* Progress */
const track: CSSProperties = {
  height: 8,
  borderRadius: 9999,
  marginTop: 12,
  background: "var(--track, #edf2f7)",
};
const trackSm: CSSProperties = {
  height: 6,
  borderRadius: 9999,
  background: "var(--track, #edf2f7)",
};
const fill = (pct: number, color?: string): CSSProperties => ({
  width: `${Math.max(0, Math.min(100, pct))}%`,
  height: "100%",
  borderRadius: 9999,
  background: color ?? "var(--brand)",
  transition: "width 220ms ease",
});

/* Helpers */
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function hexToRgba(hex: string, alpha = 0.15) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha)})`;
}

/* ================= Component ================= */
export default function ResultPanel({ result, isBusy = false }: ResultPanelProps): JSX.Element {
  const stateStyle = isBusy ? busyStateStyle : undefined;
  const hasResult = !!result;
  const classificationColor = hasResult ? result!.classification.color : "#2563eb";
  const badgeBg = hexToRgba(classificationColor, 0.14);

  return (
    <>
      {/* ====== Resultaat (modern header) ====== */}
      <div
        className="card"
        data-mounted={true}
        style={{ ...cardStyle, ...sectionStyle, ...stateStyle }}
        aria-busy={isBusy}
      >
        <h2 style={headingStyle}>Resultaat</h2>

        {hasResult ? (
          <>
            {/* Header: classificatie-badge + totaalscore + lead */}
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span
                    aria-label={`Classificatie ${result!.classification.label}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 600,
                      color: classificationColor,
                      background: badgeBg,
                      border: `1px solid ${hexToRgba(classificationColor, 0.25)}`,
                    }}
                  >
                    ● {result!.classification.label}
                  </span>

                  <div style={{ fontSize: 30, fontWeight: 800, color: "var(--brand-navy)", lineHeight: 1 }}>
                    {result!.totalScoreLabel}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>{result!.classification.lead}</p>
              </div>

              {/* Total progress */}
              <div>
                <div style={{ ...smallTextStyle, marginBottom: 6 }}>Totaalscore</div>
                <div className="progress-brand" style={track} aria-label="Totaalscore voortgang">
                  <div
                    className="progress-brand__fill"
                    style={fill(result!.totalScoreProgress, classificationColor)}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={result!.totalScoreProgress}
                  />
                </div>
              </div>

              {/* Group chips */}
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  marginTop: 4,
                }}
              >
                {result!.groupScores.map((gs) => (
                  <div
                    key={gs.key}
                    style={{
                      border: "1px solid var(--border)",
                      background: "var(--panel, #fff)",
                      borderRadius: 14,
                      padding: 12,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{gs.title}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" }}>{gs.scoreLabel}</div>
                    </div>
                    <div className="progress-brand" style={trackSm} aria-label={`${gs.title} voortgang`}>
                      <div
                        className="progress-brand__fill"
                        style={fill(gs.progress, classificationColor)}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={gs.progress}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={smallTextStyle}>Nog geen resultaat beschikbaar.</div>
        )}
      </div>

      {/* ====== Belangrijkste bijdragers ====== */}
      <div className="card" style={{ ...cardStyle, ...sectionStyle, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={headingStyle}>Belangrijkste bijdragers</h2>
        {hasResult ? (
          result!.topContributors.length ? (
            <ol style={{ ...listStyle, listStyle: "decimal" }}>
              {result!.topContributors.map((item) => (
                <li
                  key={item.key}
                  style={{
                    marginBottom: 8,
                    padding: 10,
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    background: "var(--panel, #fff)",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "var(--brand-navy)" }}>{item.title}</div>
                  <div style={{ ...smallTextStyle, marginTop: 2 }}>{item.detail}</div>
                </li>
              ))}
            </ol>
          ) : (
            <div style={smallTextStyle}>Geen bijdragen beschikbaar.</div>
          )
        ) : (
          <div style={smallTextStyle}>Nog geen resultaat beschikbaar.</div>
        )}
      </div>

      {/* ====== Groepsscores (compat-lijst) ====== */}
      <div className="card" style={{ ...cardStyle, ...sectionStyle, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={headingStyle}>Groepsscores</h2>
        {hasResult ? (
          <div>
            {result!.groupScores.map((gs) => (
              <div key={gs.key} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "var(--brand-navy)",
                    fontSize: 14,
                  }}
                >
                  <span>{gs.title}</span>
                  <span>{gs.scoreLabel}</span>
                </div>
                <div className="progress-brand" style={trackSm}>
                  <div
                    className="progress-brand__fill"
                    style={fill(gs.progress, classificationColor)}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={gs.progress}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={smallTextStyle}>Geen groepsscores beschikbaar.</div>
        )}
      </div>
    </>
  );
}
