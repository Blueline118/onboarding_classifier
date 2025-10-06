/*
OnboardingClassifier v1.0.0 — Single-file React + TypeScript component
Usage (CodeSandbox React + TypeScript template):
  1) Create file: OnboardingClassifier.tsx and paste this entire content.
  2) In App.tsx:
       import OnboardingClassifier from "./OnboardingClassifier";
       export default function App(){ return <OnboardingClassifier/> }
  3) No Tailwind required. Uses inline styles only.

Features
- Inputs: numeric, dropdowns, multi-select checkboxes (Dutch labels)
- Editable group weights (must sum to 1.0) + warning
- Advanced per-variable weights editor
- Deterministic scoring 0..100 → Classification (A1–C1) + lead time
- Editable thresholds
- Result card with progress bar + top-3 contributors
- Scenario compare (A/B) via localStorage, side-by-side
- Export CSV (inputs + group scores + total + class + lead time)
- Reset to defaults
*/

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { loadPresets, savePreset, deletePreset, PresetRecord, PresetPayload } from "./lib/presets";


// ---------- Types ----------

type NumDict = Record<string, number>;

type DropdownOption = { label: string; value: string };

type MultiOptions = Record<string, boolean>;

type Inputs = {
  // Numeric
  skuCount: number;
  orderVolume: number;
  orderPeak: number;
  retourPercentage: number; // 0..100
  aantalAfdelingen: number;
  // Dropdowns
  skuComplexity: string; // standaard/varianten/bundels
  seizoensinvloed: string; // laag/medium/hoog
  platformType: string; // Shopify/Magento/WooCommerce/Lightspeed/Bol.com/API
  typeKoppeling: string; // API/SFTP/plugin/handmatig
  configDoor: string; // klant/postnl/hybride
  mateMaatwerk: string; // geen/licht/zwaar
  mappingComplexiteit: string; // standaard/custom/dynamisch
  testCapaciteit: string; // laag/gemiddeld/hoog
  voorraadBeheer: string; // realtime/batch/handmatig
  replenishment: string; // geautomatiseerd/periodiek/handmatig
  verzendMethoden: string; // standaard/maatwerk/externe
  retourProces: string; // portaal/handmatig
  dashboardGebruik: string; // dagelijks/wekelijks/zelden
  rapportageBehoefte: string; // standaard/uitgebreid/maatwerk
  serviceUitbreiding: string; // nee/ja
  scopeWijzigingen: string; // weinig/gemiddeld/veel
  // Multi-select
  vasActiviteiten: MultiOptions; // stickeren/bundelen/inspectie
  inboundBijzonderheden: MultiOptions; // kwaliteitscontrole/afwijkende verpakking/barcodering
  postnlApis: MultiOptions; // Locatie/Checkout/Retour/Track & Trace
};

type GroupWeights = {
  operationeel: number;
  technisch: number;
  configuratie: number;
  organisatie: number;
  processen: number;
  rapportage: number;
  contract: number;
};

type Thresholds = {
  A1: number; // upper bound inclusive for A1
  A2: number;
  A3: number;
  B1: number;
  B2: number;
  C1: number; // 100
};

// Variable-level weights per group
interface VarWeights {
  // operationeel
  skuCount: number;
  orderVolume: number;
  orderPeak: number;
  retourPercentage: number;
  skuComplexity: number;
  seizoensinvloed: number;
  vasActiviteiten: number;
  inboundBijzonderheden: number;
  // technisch
  platformType: number;
  typeKoppeling: number;
  postnlApis: number;
  // configuratie
  configDoor: number;
  mateMaatwerk: number;
  mappingComplexiteit: number;
  testCapaciteit: number;
  // organisatie
  aantalAfdelingen: number;
  scopeWijzigingen: number;
  // processen
  voorraadBeheer: number;
  replenishment: number;
  verzendMethoden: number;
  retourProces: number;
  // rapportage
  dashboardGebruik: number;
  rapportageBehoefte: number;
  // contract
  serviceUitbreiding: number;
}

// ---------- Defaults ----------

const defaultInputs = (): Inputs => ({
  skuCount: 300,
  orderVolume: 5000,
  orderPeak: 8000,
  retourPercentage: 7,
  aantalAfdelingen: 2,
  skuComplexity: "varianten",
  seizoensinvloed: "medium",
  platformType: "Shopify",
  typeKoppeling: "API",
  configDoor: "postnl",
  mateMaatwerk: "licht",
  mappingComplexiteit: "custom",
  testCapaciteit: "gemiddeld",
  voorraadBeheer: "realtime",
  replenishment: "periodiek",
  verzendMethoden: "maatwerk",
  retourProces: "portaal",
  dashboardGebruik: "wekelijks",
  rapportageBehoefte: "uitgebreid",
  serviceUitbreiding: "nee",
  scopeWijzigingen: "gemiddeld",
  vasActiviteiten: { stickeren: true, bundelen: false, inspectie: false },
  inboundBijzonderheden: { kwaliteitscontrole: true, "afwijkende verpakking": false, barcodering: true },
  postnlApis: { Locatie: true, Checkout: true, Retour: true, "Track & Trace": true },
});

const defaultGroupWeights = (): GroupWeights => ({
  operationeel: 0.25,
  technisch: 0.15,
  configuratie: 0.15,
  organisatie: 0.14,
  processen: 0.11,
  rapportage: 0.10,
  contract: 0.10,
});

const defaultVarWeights = (): VarWeights => ({
  skuCount: 0.25,
  orderVolume: 0.20,
  orderPeak: 0.10,
  retourPercentage: 0.10,
  skuComplexity: 0.15,
  seizoensinvloed: 0.05,
  vasActiviteiten: 0.15,
  inboundBijzonderheden: 0.10,
  platformType: 0.40,
  typeKoppeling: 0.40,
  postnlApis: 0.20,
  configDoor: 0.30,
  mateMaatwerk: 0.30,
  mappingComplexiteit: 0.25,
  testCapaciteit: 0.15,
  aantalAfdelingen: 0.50,
  scopeWijzigingen: 0.50,
  voorraadBeheer: 0.35,
  replenishment: 0.30,
  verzendMethoden: 0.20,
  retourProces: 0.15,
  dashboardGebruik: 0.50,
  rapportageBehoefte: 0.50,
  serviceUitbreiding: 1.0,
});

const defaultThresholds = (): Thresholds => ({
  A1: 20,
  A2: 35,
  A3: 50,
  B1: 65,
  B2: 80,
  C1: 100,
});

// ---------- Helpers: normalization mappings (0..100) ----------
// We keep mappings simple and documented for transparency.

function clamp(x: number, min = 0, max = 100) { return Math.max(min, Math.min(max, x)); }

// Numeric scalers — tuned for reasonableness; adjust in future versions if needed.
const scaleSkuCount = (n: number) => clamp((n / 2000) * 100); // 0 at 0, 100 at 2000+
const scaleOrderVolume = (n: number) => clamp((n / 20000) * 100); // 100 at 20k/mo
const scaleOrderPeak = (n: number) => clamp((n / 40000) * 100); // 100 at 40k in piekmaand
const scaleRetourPct = (n: number) => clamp(n); // already 0..100
const scaleAfdelingen = (n: number) => clamp(((n - 1) / 6) * 100); // 1..7 depts → 0..100

// Dropdown categorical → score 0..100 (higher = complexer)
const mapSkuComplexity: NumDict = { standaard: 10, varianten: 50, bundels: 80 };
const mapSeizoen: NumDict = { laag: 10, medium: 45, hoog: 80 };
const mapPlatform: NumDict = { Shopify: 20, Magento: 60, WooCommerce: 40, Lightspeed: 25, "Bol.com": 50, API: 70 };
const mapKoppeling: NumDict = { API: 70, SFTP: 40, plugin: 30, handmatig: 80 };
const mapConfigDoor: NumDict = { klant: 60, postnl: 30, hybride: 50 };
const mapMaatwerk: NumDict = { geen: 10, licht: 45, zwaar: 85 };
const mapMapping: NumDict = { standaard: 20, custom: 60, dynamisch: 80 };
const mapTestCap: NumDict = { laag: 80, gemiddeld: 45, hoog: 20 };
const mapVoorraad: NumDict = { realtime: 30, batch: 55, handmatig: 85 };
const mapRepl: NumDict = { geautomatiseerd: 30, periodiek: 55, handmatig: 80 };
const mapVerzend: NumDict = { standaard: 25, maatwerk: 65, externe: 75 };
const mapRetourProc: NumDict = { portaal: 35, handmatig: 75 };
const mapDashUse: NumDict = { dagelijks: 20, wekelijks: 45, zelden: 70 };
const mapRapport: NumDict = { standaard: 30, uitgebreid: 55, maatwerk: 80 };
const mapServiceExp: NumDict = { nee: 30, ja: 75 };
const mapScope: NumDict = { weinig: 30, gemiddeld: 55, veel: 80 };

// Multi-select contribution: fraction of selected options * 100
const scaleMulti = (opts: MultiOptions) => {
  const keys = Object.keys(opts);
  if (!keys.length) return 0;
  const selected = keys.filter(k => !!opts[k]).length;
  return clamp((selected / keys.length) * 100);
};

// ---------- Group assignments (which variables belong to which group) ----------
const groupVars = {
  operationeel: ["skuCount","orderVolume","orderPeak","retourPercentage","skuComplexity","seizoensinvloed","vasActiviteiten","inboundBijzonderheden"],
  technisch: ["platformType","typeKoppeling","postnlApis"],
  configuratie: ["configDoor","mateMaatwerk","mappingComplexiteit","testCapaciteit"],
  organisatie: ["aantalAfdelingen","scopeWijzigingen"],
  processen: ["voorraadBeheer","replenishment","verzendMethoden","retourProces"],
  rapportage: ["dashboardGebruik","rapportageBehoefte"],
  contract: ["serviceUitbreiding"],
} as const;

type GroupKey = keyof typeof groupVars;

// ---------- Compute normalized variable scores (0..100) ----------
function variableScore(key: keyof VarWeights, v: Inputs): number {
  switch (key) {
    case "skuCount": return scaleSkuCount(v.skuCount);
    case "orderVolume": return scaleOrderVolume(v.orderVolume);
    case "orderPeak": return scaleOrderPeak(v.orderPeak);
    case "retourPercentage": return scaleRetourPct(v.retourPercentage);
    case "aantalAfdelingen": return scaleAfdelingen(v.aantalAfdelingen);

    case "skuComplexity": return mapSkuComplexity[v.skuComplexity] ?? 40;
    case "seizoensinvloed": return mapSeizoen[v.seizoensinvloed] ?? 45;
    case "platformType": return mapPlatform[v.platformType] ?? 50;
    case "typeKoppeling": return mapKoppeling[v.typeKoppeling] ?? 50;
    case "configDoor": return mapConfigDoor[v.configDoor] ?? 50;
    case "mateMaatwerk": return mapMaatwerk[v.mateMaatwerk] ?? 50;
    case "mappingComplexiteit": return mapMapping[v.mappingComplexiteit] ?? 50;
    case "testCapaciteit": return mapTestCap[v.testCapaciteit] ?? 50;
    case "voorraadBeheer": return mapVoorraad[v.voorraadBeheer] ?? 50;
    case "replenishment": return mapRepl[v.replenishment] ?? 50;
    case "verzendMethoden": return mapVerzend[v.verzendMethoden] ?? 50;
    case "retourProces": return mapRetourProc[v.retourProces] ?? 55;
    case "dashboardGebruik": return mapDashUse[v.dashboardGebruik] ?? 45;
    case "rapportageBehoefte": return mapRapport[v.rapportageBehoefte] ?? 55;
    case "serviceUitbreiding": return mapServiceExp[v.serviceUitbreiding] ?? 30;

    case "vasActiviteiten": return scaleMulti(v.vasActiviteiten);
    case "inboundBijzonderheden": return scaleMulti(v.inboundBijzonderheden);
    case "postnlApis": return clamp(100 - scaleMulti(v.postnlApis)); // meer PostNL API’s verlaagt complexiteit

    case "scopeWijzigingen": return mapScope[v.scopeWijzigingen] ?? 55;
    default: return 50;
  }
}

// Compute group score and contributions per variable
function computeGroupScore(group: GroupKey, inputs: Inputs, varW: VarWeights) {
  // NIEUW — leesbare readonly array
const vars = groupVars[group] as ReadonlyArray<keyof VarWeights>;

  let totalW = 0;
  let sum = 0;
  const contributions: { key: string; score: number; weight: number; contribution: number }[] = [];
  vars.forEach((k) => {
    const s = variableScore(k, inputs);
    const w = varW[k];
    totalW += w;
    sum += s * w;
    contributions.push({ key: k, score: s, weight: w, contribution: s * w });
  });
  const groupScore = totalW > 0 ? sum / totalW : 0;
  return { groupScore, contributions };
}

function classify(score: number, th: Thresholds) {
  const s = clamp(score);
  if (s <= th.A1) return { code: "A1", lead: "2–3 weken", color: "#16a34a" };
  if (s <= th.A2) return { code: "A2", lead: "3–4 weken", color: "#22c55e" };
  if (s <= th.A3) return { code: "A3", lead: "4–6 weken", color: "#84cc16" };
  if (s <= th.B1) return { code: "B1", lead: "4–5 weken", color: "#f59e0b" };
  if (s <= th.B2) return { code: "B2", lead: "5–7 weken", color: "#f97316" };
  return { code: "C1", lead: "8–12 weken", color: "#ef4444" };
}

// ---------- UI helpers ----------
const section: React.CSSProperties = { marginBottom: 24 };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" };
const label: React.CSSProperties = { fontSize: 13, color: "#374151", marginBottom: 6, display: "block" };
const input: React.CSSProperties = { width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 };
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 700, margin: "0 0 8px" };
const small: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

const dropdown = (opts: string[]) => opts.map((o) => ({ label: o, value: o }));

const DD = {
  skuComplexity: dropdown(["standaard","varianten","bundels"]),
  seizoensinvloed: dropdown(["laag","medium","hoog"]),
  platformType: dropdown(["Shopify","Magento","WooCommerce","Lightspeed","Bol.com","API"]),
  typeKoppeling: dropdown(["API","SFTP","plugin","handmatig"]),
  configDoor: dropdown(["klant","postnl","hybride"]),
  mateMaatwerk: dropdown(["geen","licht","zwaar"]),
  mappingComplexiteit: dropdown(["standaard","custom","dynamisch"]),
  testCapaciteit: dropdown(["laag","gemiddeld","hoog"]),
  voorraadBeheer: dropdown(["realtime","batch","handmatig"]),
  replenishment: dropdown(["geautomatiseerd","periodiek","handmatig"]),
  verzendMethoden: dropdown(["standaard","maatwerk","externe"]),
  retourProces: dropdown(["portaal","handmatig"]),
  dashboardGebruik: dropdown(["dagelijks","wekelijks","zelden"]),
  rapportageBehoefte: dropdown(["standaard","uitgebreid","maatwerk"]),
  serviceUitbreiding: dropdown(["nee","ja"]),
  scopeWijzigingen: dropdown(["weinig","gemiddeld","veel"]),
};

// ---------- CSV Export ----------
function toCSV(rows: Record<string, any>[]) {
  const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")].concat(rows.map(r => headers.map(h => esc(r[h])).join(",")));
  return lines.join("\n");
}

// ---------- Main Component ----------
export default function OnboardingClassifier() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs());
  const [gw, setGw] = useState<GroupWeights>(defaultGroupWeights());
  const [vw, setVw] = useState<VarWeights>(defaultVarWeights());
  const [th, setTh] = useState<Thresholds>(defaultThresholds());
  const [showAdvanced, setShowAdvanced] = useState(false);
const [presetMsg, setPresetMsg] = useState("");


  // Presets
const [presets, setPresets] = useState<PresetRecord[]>([]);
const [presetName, setPresetName] = useState("");
const [selectedPresetId, setSelectedPresetId] = useState<string>("");
const [loadingPresets, setLoadingPresets] = useState(false);

async function refreshPresets() {
  setLoadingPresets(true);
  const list = await loadPresets();
  setPresets(list);
  setLoadingPresets(false);
}

useEffect(() => { refreshPresets(); }, []);

async function handleSavePreset() {
  setPresetMsg("Opslaan…");
  try {
    const payload: PresetPayload = { inputs, gw, vw, th, label: "v1.0.1" };
    await savePreset(presetName, payload);
    setPresetMsg("Opgeslagen ✔");
    setPresetName("");
    await refreshPresets();
  } catch (e: any) {
    console.error("savePreset failed", e);
    setPresetMsg("Fout bij opslaan — zie Console");
  }
}

async function handleApplyPreset() {
  const rec = presets.find(p => (p.id ?? p.name) === selectedPresetId);
  if (!rec) return;
  const data = rec.data;
  setInputs(data.inputs);
  setGw(data.gw);
  setVw(data.vw);
  setTh(data.th);
}
async function handleDeletePreset() {
  if (!selectedPresetId) return;
  await deletePreset(selectedPresetId);
  setSelectedPresetId("");
  await refreshPresets();
}

// Scenario compare (A/B) in localStorage
  const [scenarioName, setScenarioName] = useState("Scenario A");
  const [otherScenario, setOtherScenario] = useState<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("onbClassifierScenarioB");
    if (saved) setOtherScenario(JSON.parse(saved));
  }, []);

  const groupSum = Object.values(gw).reduce((a, b) => a + b, 0);
  const groupWarning = Math.abs(1 - groupSum) > 0.0001;

  // Compute scores per group and total
  const { groupScores, contributionsAll, totalScore, classification } = useMemo(() => {
    const entries: { key: GroupKey; score: number; contribs: { key: string; score: number; weight: number; contribution: number }[] }[] = [];
    (Object.keys(groupVars) as GroupKey[]).forEach((g) => {
      const { groupScore, contributions } = computeGroupScore(g, inputs, vw);
      entries.push({ key: g, score: groupScore, contribs: contributions });
    });
    const total = entries.reduce((acc, e) => acc + (e.score * (gw as any)[e.key]), 0);
    const contribs = entries.flatMap(e => e.contribs.map(c => ({ ...c, group: e.key, groupWeight: (gw as any)[e.key] })));
    const cls = classify(total * 1, th);
    return { groupScores: entries, contributionsAll: contribs, totalScore: clamp(total), classification: cls };
  }, [inputs, gw, vw, th]);

  const top3 = useMemo(() => {
    const ranked = contributionsAll
      .map(c => ({
        key: c.key,
        group: c.group,
        score: c.score,
        weight: c.weight,
        groupWeight: c.groupWeight,
        absContribution: Math.abs(c.score * c.weight * c.groupWeight),
      }))
      .sort((a, b) => b.absContribution - a.absContribution)
      .slice(0, 3);
    return ranked;
  }, [contributionsAll]);

  // Handlers
  const update = (patch: Partial<Inputs>) => setInputs(prev => ({ ...prev, ...patch }));
  const updateMulti = (key: keyof Inputs, sub: string, val: boolean) => {
    setInputs(prev => ({ ...prev, [key]: { ...(prev as any)[key], [sub]: val } as any }));
  };

  const saveScenarioB = () => {
    const payload = { inputs, gw, vw, th, label: "Scenario B" };
    localStorage.setItem("onbClassifierScenarioB", JSON.stringify(payload));
    setOtherScenario(payload);
  };

  const exportCsv = () => {
    const row: Record<string, any> = { totalScore: totalScore.toFixed(1), class: classification.code, lead: classification.lead };
    Object.entries(inputs).forEach(([k, v]) => {
      if (typeof v === "object" && v !== null) {
        row[k] = Object.entries(v as any).filter(([, on]) => !!on).map(([name]) => name).join("; ");
      } else {
        row[k] = v as any;
      }
    });
    groupScores.forEach(gs => (row[`group_${gs.key}`] = gs.score.toFixed(1)));
    const csv = toCSV([row]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "onboarding-classifier.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setInputs(defaultInputs());
    setGw(defaultGroupWeights());
    setVw(defaultVarWeights());
    setTh(defaultThresholds());
  };

  // ---------- Render ----------
  return (
    <div style={{ maxWidth: 1200, margin: "24px auto", padding: 16, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Onboarding Classifier</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportCsv} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#111827", color: "#fff" }}>Export CSV</button>
          <button onClick={saveScenarioB} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#2563eb", color: "#fff" }}>Bewaar Scenario B</button>
          <button onClick={resetAll} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}>Reset</button>
        </div>
      </div>

{/* --- PRESETS CARD --- */}
<div data-id="presets-card" style={{ ...card, ...section }}>
  <h2 style={h2}>Presets</h2>
  <div style={grid3}>
    <div>
      <label style={label}>Naam</label>
      <input
        style={input}
        placeholder="Bijv. Klant X – Q4"
        value={presetName}
        onChange={(e) => setPresetName(e.target.value)}
      />
      <button
        onClick={handleSavePreset}
        style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#111827", color: "#fff" }}
      >
        Opslaan
      </button>
      <div style={{ fontSize:12, color:'#6b7280', marginTop:8 }}>{presetMsg}</div>
    </div>

    <div>
      <label style={label}>Beschikbare presets {loadingPresets ? "(laden…)" : ""}</label>
      <select
        style={input}
        value={selectedPresetId}
        onChange={(e) => setSelectedPresetId(e.target.value)}
      >
        <option value="">— kies preset —</option>
        {presets.map((p) => (
          <option key={p.id ?? p.name} value={p.id ?? p.name}>
            {p.name}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button
          onClick={handleApplyPreset}
          disabled={!selectedPresetId}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#2563eb", color: "#fff" }}
        >
          Toepassen
        </button>
        <button
          onClick={handleDeletePreset}
          disabled={!selectedPresetId}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}
        >
          Verwijderen
        </button>
        <button
          onClick={refreshPresets}
          style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}
        >
          Vernieuwen
        </button>
        <button
  onClick={async () => {
    if (!supabase) { setPresetMsg("Supabase niet geconfigureerd"); return; }
    setPresetMsg("Test insert…");
    const { error } = await supabase
      .from("classifier_presets")
      .insert({ name: "smoke", data: { hello: "world" } });
    setPresetMsg(error ? `Error: ${error.message}` : "Test insert OK ✔");
  }}
  style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #e5e7eb', background:'#fff' }}
>
  Test insert
</button>
      </div>

      <div style={small}>
        Opslag: {supabase ? "Supabase" : "Browser (localStorage)"}
      </div>
    </div>
  </div>
</div>
{/* --- EINDE PRESETS CARD --- */}

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
        {/* Left: Inputs */}
        <div>
          <div style={{ ...card, ...section }}>
            <h2 style={h2}>Basiskenmerken</h2>
            <div style={grid3}>
              <div>
                <label style={label}>Aantal SKU’s</label>
                <input style={input} type="number" min={0} max={100000} value={inputs.skuCount} onChange={e => update({ skuCount: Number(e.target.value) })} />
              </div>
              <div>
                <label style={label}>Ordervolume / maand</label>
                <input style={input} type="number" min={0} max={10000000} value={inputs.orderVolume} onChange={e => update({ orderVolume: Number(e.target.value) })} />
              </div>
              <div>
                <label style={label}>Orderpiek / maand</label>
                <input style={input} type="number" min={0} max={10000000} value={inputs.orderPeak} onChange={e => update({ orderPeak: Number(e.target.value) })} />
              </div>
              <div>
                <label style={label}>Retourpercentage %</label>
                <input style={input} type="number" min={0} max={100} value={inputs.retourPercentage} onChange={e => update({ retourPercentage: Number(e.target.value) })} />
              </div>
              <div>
                <label style={label}>Aantal afdelingen (klantzijde)</label>
                <input style={input} type="number" min={1} max={10} value={inputs.aantalAfdelingen} onChange={e => update({ aantalAfdelingen: Number(e.target.value) })} />
              </div>
              <div>
                <label style={label}>SKU-complexiteit</label>
                <select style={input} value={inputs.skuComplexity} onChange={e => update({ skuComplexity: e.target.value })}>
                  {DD.skuComplexity.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Seizoensinvloed</label>
                <select style={input} value={inputs.seizoensinvloed} onChange={e => update({ seizoensinvloed: e.target.value })}>
                  {DD.seizoensinvloed.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Platformtype</label>
                <select style={input} value={inputs.platformType} onChange={e => update({ platformType: e.target.value })}>
                  {DD.platformType.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Type koppeling</label>
                <select style={input} value={inputs.typeKoppeling} onChange={e => update({ typeKoppeling: e.target.value })}>
                  {DD.typeKoppeling.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Configuratie door</label>
                <select style={input} value={inputs.configDoor} onChange={e => update({ configDoor: e.target.value })}>
                  {DD.configDoor.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Mate van maatwerk</label>
                <select style={input} value={inputs.mateMaatwerk} onChange={e => update({ mateMaatwerk: e.target.value })}>
                  {DD.mateMaatwerk.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Mapping-complexiteit</label>
                <select style={input} value={inputs.mappingComplexiteit} onChange={e => update({ mappingComplexiteit: e.target.value })}>
                  {DD.mappingComplexiteit.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Testcapaciteit (klant)</label>
                <select style={input} value={inputs.testCapaciteit} onChange={e => update({ testCapaciteit: e.target.value })}>
                  {DD.testCapaciteit.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Voorraadbeheer</label>
                <select style={input} value={inputs.voorraadBeheer} onChange={e => update({ voorraadBeheer: e.target.value })}>
                  {DD.voorraadBeheer.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Replenishment</label>
                <select style={input} value={inputs.replenishment} onChange={e => update({ replenishment: e.target.value })}>
                  {DD.replenishment.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Verzendmethoden</label>
                <select style={input} value={inputs.verzendMethoden} onChange={e => update({ verzendMethoden: e.target.value })}>
                  {DD.verzendMethoden.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Retourproces</label>
                <select style={input} value={inputs.retourProces} onChange={e => update({ retourProces: e.target.value })}>
                  {DD.retourProces.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Dashboardgebruik</label>
                <select style={input} value={inputs.dashboardGebruik} onChange={e => update({ dashboardGebruik: e.target.value })}>
                  {DD.dashboardGebruik.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Rapportagebehoefte</label>
                <select style={input} value={inputs.rapportageBehoefte} onChange={e => update({ rapportageBehoefte: e.target.value })}>
                  {DD.rapportageBehoefte.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Service-uitbreiding</label>
                <select style={input} value={inputs.serviceUitbreiding} onChange={e => update({ serviceUitbreiding: e.target.value })}>
                  {DD.serviceUitbreiding.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Scopewijzigingen</label>
                <select style={input} value={inputs.scopeWijzigingen} onChange={e => update({ scopeWijzigingen: e.target.value })}>
                  {DD.scopeWijzigingen.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ ...card, ...section }}>
            <h2 style={h2}>Multi-select</h2>
            <div style={grid3}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>VAS-activiteiten</div>
                {Object.keys(inputs.vasActiviteiten).map(k => (
                  <label key={k} style={{ display: "block", marginBottom: 6 }}>
                    <input type="checkbox" checked={inputs.vasActiviteiten[k]} onChange={e => updateMulti("vasActiviteiten", k, e.target.checked)} /> {k}
                  </label>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Inbound bijzonderheden</div>
                {Object.keys(inputs.inboundBijzonderheden).map(k => (
                  <label key={k} style={{ display: "block", marginBottom: 6 }}>
                    <input type="checkbox" checked={inputs.inboundBijzonderheden[k]} onChange={e => updateMulti("inboundBijzonderheden", k, e.target.checked)} /> {k}
                  </label>
                ))}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>PostNL API’s in gebruik</div>
                {Object.keys(inputs.postnlApis).map(k => (
                  <label key={k} style={{ display: "block", marginBottom: 6 }}>
                    <input type="checkbox" checked={inputs.postnlApis[k]} onChange={e => updateMulti("postnlApis", k, e.target.checked)} /> {k}
                  </label>
                ))}
                <div style={small}>Meer PostNL API’s verlaagt de complexiteitsscore (beter).</div>
              </div>
            </div>
          </div>

          <div style={{ ...card, ...section }}>
            <h2 style={h2}>Weging per groep</h2>
            {groupWarning && (<div style={{ color: "#b91c1c", marginBottom: 8 }}>Let op: de som van groepswegingen moet 1.0 zijn. Huidig: {groupSum.toFixed(2)}</div>)}
            <div style={grid2}>
              {(Object.keys(gw) as (keyof GroupWeights)[]).map((gk) => (
                <div key={gk}>
                  <label style={label}>{gk} ({(gw as any)[gk].toFixed(2)})</label>
                  <input style={{ width: "100%" }} type="range" min={0} max={1} step={0.01} value={(gw as any)[gk]} onChange={e => setGw({ ...gw, [gk]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, ...section }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={h2}>Geavanceerd: variabele wegingen & thresholds</h2>
              <button onClick={() => setShowAdvanced(s => !s)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}>{showAdvanced ? "Verberg" : "Toon"}</button>
            </div>
            {showAdvanced && (
              <div>
                <div style={{ ...small, marginBottom: 8 }}>Pas per-variabele gewichten aan (0..1). Binnen elke groep worden deze genormaliseerd door het totaal.</div>
                <div style={grid3}>
                  {(Object.keys(vw) as (keyof VarWeights)[]).map(k => (
                    <div key={String(k)}>
                      <label style={label}>{String(k)} ({vw[k].toFixed(2)})</label>
                      <input type="number" min={0} max={1} step={0.01} style={input} value={vw[k]} onChange={e => setVw({ ...vw, [k]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Drempels (thresholds)</div>
                  <div style={grid3}>
                    {(["A1","A2","A3","B1","B2","C1"] as (keyof Thresholds)[]).map(k => (
                      <div key={k}>
                        <label style={label}>{k}</label>
                        <input type="number" min={0} max={100} step={1} style={input} value={th[k]} onChange={e => setTh({ ...th, [k]: Number(e.target.value) })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div>
          <div style={{ ...card, ...section }}>
            <h2 style={h2}>Resultaat</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ padding: "4px 10px", borderRadius: 999, background: classification.color, color: "#fff", fontWeight: 700 }}>{classification.code}</span>
              <span style={{ fontWeight: 700 }}>{totalScore.toFixed(1)}</span>
              <span style={small}>score</span>
            </div>
            <div style={{ height: 10, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${totalScore}%`, height: "100%", background: classification.color }} />
            </div>
            <div style={{ marginBottom: 8 }}><strong>Verwachte doorlooptijd:</strong> {classification.lead}</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Belangrijkste factoren</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {top3.map((t, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{t.key} <span style={small}>({t.group})</span></li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Groepsscores</div>
              {(groupScores).map(gs => (
                <div key={gs.key} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ textTransform: "capitalize" }}>{gs.key}</span>
                    <span>{gs.score.toFixed(1)}</span>
                  </div>
                  <div style={{ height: 6, background: "#f3f4f6", borderRadius: 999 }}>
                    <div style={{ width: `${clamp(gs.score)}%`, height: "100%", background: "#60a5fa", borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario compare */}
          <div style={{ ...card }}>
            <h2 style={h2}>Scenario-vergelijking</h2>
            <div style={{ ...small, marginBottom: 8 }}>Bewaar de huidige invoer als Scenario B en vergelijk.</div>
            <div style={grid2}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{scenarioName}</div>
                <div style={{ marginBottom: 4 }}>Score: {totalScore.toFixed(1)}</div>
                <div>Class: {classification.code} • {classification.lead}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{otherScenario?.label ?? "Scenario B (geen)"}</div>
                {otherScenario ? (
                  <>
                    <div style={{ marginBottom: 4 }}>Score: {(() => {
                      // Recompute other scenario score quickly
                      const scInputs = otherScenario.inputs as Inputs;
                      const scGw = otherScenario.gw as GroupWeights;
                      const scVw = otherScenario.vw as VarWeights;
                      const entries: any[] = [];
                      (Object.keys(groupVars) as GroupKey[]).forEach((g) => {
                        const r = computeGroupScore(g, scInputs, scVw);
                        entries.push({ key: g, score: r.groupScore });
                      });
                      const total = entries.reduce((acc, e) => acc + e.score * (scGw as any)[e.key], 0);
                      return clamp(total).toFixed(1);
                    })()}</div>
                    <div>Class: {(() => {
                      const scInputs = otherScenario.inputs as Inputs;
                      const scGw = otherScenario.gw as GroupWeights;
                      const scVw = otherScenario.vw as VarWeights;
                      const scTh = otherScenario.th as Thresholds;
                      const entries: any[] = [];
                      (Object.keys(groupVars) as GroupKey[]).forEach((g) => {
                        const r = computeGroupScore(g, scInputs, scVw);
                        entries.push({ key: g, score: r.groupScore });
                      });
                      const total = entries.reduce((acc, e) => acc + e.score * (scGw as any)[e.key], 0);
                      const cls = classify(total, scTh);
                      return `${cls.code} • ${cls.lead}`;
                    })()}</div>
                  </>
                ) : (
                  <div style={small}>Nog geen Scenario B opgeslagen.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "right", marginTop: 12, color: "#9ca3af", fontSize: 12 }}>
        v1.0.0 — Onboarding Classifier
      </div>
    </div>
  );
}

/* Example App.tsx
import OnboardingClassifier from "./OnboardingClassifier";
export default function App(){
  return <OnboardingClassifier/>;
}
*/
