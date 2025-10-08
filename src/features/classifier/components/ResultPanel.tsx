import type { CSSProperties, FC } from "react";
import type { ClassifierResult } from "../types";

export interface ResultPanelProps {
  result: ClassifierResult | null;
  isBusy?: boolean;
}

const section: CSSProperties = { marginBottom: 24 };
const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};
const h2: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 8px",
};
const small: CSSProperties = { fontSize: 12, color: "#6b7280" };
const list: CSSProperties = { margin: 0, paddingLeft: 20 };
const busyState: CSSProperties = { opacity: 0.6 };

const ResultPanel: FC<ResultPanelProps> = ({ result, isBusy = false }) => {
  const stateStyle = isBusy ? busyState : undefined;

  return (
    <div>
      <div style={{ ...card, ...section, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={h2}>Resultaat</h2>
        {result ? (
          <>
            <div style={{ fontSize: 32, fontWeight: 700 }}>
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
            <div
              style={{
                height: 10,
                background: "#f3f4f6",
                borderRadius: 999,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  width: `${result.totalScoreProgress}%`,
                  height: "100%",
                  background: result.classification.color,
                  borderRadius: 999,
                }}
              />
            </div>
          </>
        ) : (
          <div style={small}>Nog geen resultaat beschikbaar.</div>
        )}
      </div>

      <div style={{ ...card, ...section, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={h2}>Top 3 bijdragen</h2>
        {result ? (
          <ol style={list}>
            {result.topContributors.map((item) => (
              <li key={item.key} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ ...small }}>{item.detail}</div>
              </li>
            ))}
          </ol>
        ) : (
          <div style={small}>Geen bijdragen beschikbaar.</div>
        )}
      </div>

      <div style={{ ...card, ...section, ...stateStyle }} aria-busy={isBusy}>
        <h2 style={h2}>Groepsscores</h2>
        {result ? (
          <div>
            {result.groupScores.map((gs) => (
              <div key={gs.key} style={{ marginBottom: 8 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ textTransform: "capitalize" }}>
                    {gs.title}
                  </span>
                  <span>{gs.scoreLabel}</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: "#f3f4f6",
                    borderRadius: 999,
                  }}
                >
                  <div
                    style={{
                      width: `${gs.progress}%`,
                      height: "100%",
                      background: "#60a5fa",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={small}>Geen groepsscores beschikbaar.</div>
        )}
      </div>
    </div>
  );
};

export default ResultPanel;
