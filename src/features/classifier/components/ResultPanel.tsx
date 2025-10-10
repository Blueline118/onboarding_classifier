import type { CSSProperties, FC } from "react";
import type { ClassifierResult } from "../types";

export interface ResultPanelProps {
  result: ClassifierResult | null;
  isBusy?: boolean;
}

const section: CSSProperties = { marginBottom: 24 };
const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 20,
  boxShadow: "var(--shadow)",
};
const h2: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 8px",
  color: "var(--brand-navy)",
};
const small: CSSProperties = { fontSize: 12, color: "var(--muted)" };
const list: CSSProperties = { margin: 0, paddingLeft: 20 };
const busyState: CSSProperties = { opacity: 0.6 };

// Progress helpers
const progressTrack: CSSProperties = { height: 8, borderRadius: 9999, marginTop: 12 };
const progressTrackSm: CSSProperties = { height: 6, borderRadius: 9999 };
const progressFill = (pct: number): CSSProperties => ({
  width: `${Math.max(0, Math.min(100, pct))}%`,
  height: "100%",
  borderRadius: 9999,
});

const ResultPanel: FC<ResultPanelProps> = ({ result, isBusy = false }) => {
  const stateStyle = isBusy ? busyState : undefined;

  return (
    <>
      {/* Resultaat */}
      <div className="card" style={{ ...card, ...section, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={h2}>Resultaat</h2>
        {result ? (
          <>
            <div style={{ fontSize: 32, fontWeight: 700, color: "var(--brand-navy)" }}>
              {result.totalScoreLabel}
            </div>
            <div
              style={{
                fontSize: 18,
                color: result.classification.color,
                fontWeight: 700,
                marginTop: 4,
              }}
            >
              {result.classification.label}
            </div>

            {/* Progress */}
            <div className="progress-brand" style={progressTrack}>
              <div className="progress-brand__fill" style={progressFill(result.totalScoreProgress)} />
            </div>
          </>
        ) : (
          <div style={small}>Nog geen resultaat beschikbaar.</div>
        )}
      </div>

      {/* Top 3 bijdragen */}
      <div className="card" style={{ ...card, ...section, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={h2}>Top 3 bijdragen</h2>
        {result ? (
          <ol style={list}>
            {result.topContributors.map((item) => (
              <li key={item.key} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600, color: "var(--brand-navy)" }}>{item.title}</div>
                <div style={{ ...small }}>{item.detail}</div>
              </li>
            ))}
          </ol>
        ) : (
          <div style={small}>Geen bijdragen beschikbaar.</div>
        )}
      </div>

      {/* Groepsscores */}
      <div className="card" style={{ ...card, ...section, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={h2}>Groepsscores</h2>
        {result ? (
          <div>
            {result.groupScores.map((gs) => (
              <div key={gs.key} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--brand-navy)" }}>
                  <span style={{ textTransform: "capitalize" }}>{gs.title}</span>
                  <span>{gs.scoreLabel}</span>
                </div>
                <div className="progress-brand" style={progressTrackSm}>
                  <div className="progress-brand__fill" style={progressFill(gs.progress)} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={small}>Geen groepsscores beschikbaar.</div>
        )}
      </div>
    </>
  );
};

export default ResultPanel;
