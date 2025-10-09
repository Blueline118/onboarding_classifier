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
import {
  HeaderBar,
  InputsForm,
  ResultPanel,
  PresetsCard,
  computeScore,
  useClassifierState,
} from "@/features/classifier";
import type { ClassifierInput, ClassifierResult } from "@/features/classifier"; // ← deze regel erbij

import type { PdfSection } from "./lib/exportPdf";
import {
  loadPresets,
  savePreset,
  deletePreset,
  updatePreset,
  type PresetRecord,
  type PresetPayload,
} from "./lib/presets";
import { useToaster } from "./components/ui/Toaster";
import { btnPrimary, btnSecondary } from "./ui/buttons";



type MultiOptions = Record<string, boolean>;

// ---------- Types ----------

type NumDict = Record<string, number>;

type Inputs = ClassifierInput;

type PresetSnapshot = {
  inputs: Inputs;
  gw: GroupWeights;
  vw: VarWeights;
  th: Thresholds;
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
  inboundBijzonderheden: {
    kwaliteitscontrole: true,
    "afwijkende verpakking": false,
    barcodering: true,
  },
  postnlApis: {
    Locatie: true,
    Checkout: true,
    Retour: true,
    "Track & Trace": true,
  },
});

const defaultGroupWeights = (): GroupWeights => ({
  operationeel: 0.25,
  technisch: 0.15,
  configuratie: 0.15,
  organisatie: 0.14,
  processen: 0.11,
  rapportage: 0.1,
  contract: 0.1,
});

const defaultVarWeights = (): VarWeights => ({
  skuCount: 0.25,
  orderVolume: 0.2,
  orderPeak: 0.1,
  retourPercentage: 0.1,
  skuComplexity: 0.15,
  seizoensinvloed: 0.05,
  vasActiviteiten: 0.15,
  inboundBijzonderheden: 0.1,
  platformType: 0.4,
  typeKoppeling: 0.4,
  postnlApis: 0.2,
  configDoor: 0.3,
  mateMaatwerk: 0.3,
  mappingComplexiteit: 0.25,
  testCapaciteit: 0.15,
  aantalAfdelingen: 0.5,
  scopeWijzigingen: 0.5,
  voorraadBeheer: 0.35,
  replenishment: 0.3,
  verzendMethoden: 0.2,
  retourProces: 0.15,
  dashboardGebruik: 0.5,
  rapportageBehoefte: 0.5,
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

const SC_B_KEY = "onb_scenario_b";
const readScenarioB = () => {
  try {
    const raw = sessionStorage.getItem(SC_B_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const writeScenarioB = (payload: any) => {
  try {
    sessionStorage.setItem(SC_B_KEY, JSON.stringify(payload));
  } catch {}
};

// ---------- Helpers: normalization mappings (0..100) ----------
// We keep mappings simple and documented for transparency.

function clamp(x: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, x));
}

function stable(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stable);
  if (obj && typeof obj === "object") {
    const out: any = {};
    Object.keys(obj)
      .sort()
      .forEach((k) => {
        out[k] = stable(obj[k]);
      });
    return out;
  }
  return obj;
}
const deepEqual = (a: any, b: any) =>
  JSON.stringify(stable(a)) === JSON.stringify(stable(b));

// Numeric scalers — tuned for reasonableness; adjust in future versions if needed.
const scaleSkuCount = (n: number) => clamp((n / 2000) * 100); // 0 at 0, 100 at 2000+
const scaleOrderVolume = (n: number) => clamp((n / 20000) * 100); // 100 at 20k/mo
const scaleOrderPeak = (n: number) => clamp((n / 40000) * 100); // 100 at 40k in piekmaand
const scaleRetourPct = (n: number) => clamp(n); // already 0..100
const scaleAfdelingen = (n: number) => clamp(((n - 1) / 6) * 100); // 1..7 depts → 0..100

// Dropdown categorical → score 0..100 (higher = complexer)
const mapSkuComplexity: NumDict = { standaard: 10, varianten: 50, bundels: 80 };
const mapSeizoen: NumDict = { laag: 10, medium: 45, hoog: 80 };
const mapPlatform: NumDict = {
  Shopify: 20,
  Magento: 60,
  WooCommerce: 40,
  Lightspeed: 25,
  "Bol.com": 50,
  API: 70,
};
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
  const selected = keys.filter((k) => !!opts[k]).length;
  return clamp((selected / keys.length) * 100);
};

// ---------- Group assignments (which variables belong to which group) ----------
const groupVars = {
  operationeel: [
    "skuCount",
    "orderVolume",
    "orderPeak",
    "retourPercentage",
    "skuComplexity",
    "seizoensinvloed",
    "vasActiviteiten",
    "inboundBijzonderheden",
  ],
  technisch: ["platformType", "typeKoppeling", "postnlApis"],
  configuratie: ["configDoor", "mateMaatwerk", "mappingComplexiteit", "testCapaciteit"],
  organisatie: ["aantalAfdelingen", "scopeWijzigingen"],
  processen: ["voorraadBeheer", "replenishment", "verzendMethoden", "retourProces"],
  rapportage: ["dashboardGebruik", "rapportageBehoefte"],
  contract: ["serviceUitbreiding"],
} as const;

type GroupKey = keyof typeof groupVars;

// ---------- Compute normalized variable scores (0..100) ----------
function variableScore(key: keyof VarWeights, v: Inputs): number {
  switch (key) {
    case "skuCount":
      return scaleSkuCount(v.skuCount);
    case "orderVolume":
      return scaleOrderVolume(v.orderVolume);
    case "orderPeak":
      return scaleOrderPeak(v.orderPeak);
    case "retourPercentage":
      return scaleRetourPct(v.retourPercentage);
    case "aantalAfdelingen":
      return scaleAfdelingen(v.aantalAfdelingen);

    case "skuComplexity":
      return mapSkuComplexity[v.skuComplexity] ?? 40;
    case "seizoensinvloed":
      return mapSeizoen[v.seizoensinvloed] ?? 45;
    case "platformType":
      return mapPlatform[v.platformType] ?? 50;
    case "typeKoppeling":
      return mapKoppeling[v.typeKoppeling] ?? 50;
    case "configDoor":
      return mapConfigDoor[v.configDoor] ?? 50;
    case "mateMaatwerk":
      return mapMaatwerk[v.mateMaatwerk] ?? 50;
    case "mappingComplexiteit":
      return mapMapping[v.mappingComplexiteit] ?? 50;
    case "testCapaciteit":
      return mapTestCap[v.testCapaciteit] ?? 50;
    case "voorraadBeheer":
      return mapVoorraad[v.voorraadBeheer] ?? 50;
    case "replenishment":
      return mapRepl[v.replenishment] ?? 50;
    case "verzendMethoden":
      return mapVerzend[v.verzendMethoden] ?? 50;
    case "retourProces":
      return mapRetourProc[v.retourProces] ?? 55;
    case "dashboardGebruik":
      return mapDashUse[v.dashboardGebruik] ?? 45;
    case "rapportageBehoefte":
      return mapRapport[v.rapportageBehoefte] ?? 55;
    case "serviceUitbreiding":
      return mapServiceExp[v.serviceUitbreiding] ?? 30;

    case "vasActiviteiten":
      return scaleMulti(v.vasActiviteiten);
    case "inboundBijzonderheden":
      return scaleMulti(v.inboundBijzonderheden);
    case "postnlApis":
      return clamp(100 - scaleMulti(v.postnlApis)); // meer PostNL API’s verlaagt complexiteit

    case "scopeWijzigingen":
      return mapScope[v.scopeWijzigingen] ?? 55;
    default:
      return 50;
  }
}

// Compute group score and contributions per variable
function computeGroupScore(group: GroupKey, inputs: Inputs, varW: VarWeights) {
  // NIEUW — leesbare readonly array
  const vars = groupVars[group] as ReadonlyArray<keyof VarWeights>;

  let totalW = 0;
  let sum = 0;
  const contributions: {
    key: string;
    score: number;
    weight: number;
    contribution: number;
  }[] = [];
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
const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};
const label: React.CSSProperties = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
  display: "block",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};
const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 16,
};
const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 8px",
};
const small: React.CSSProperties = { fontSize: 12, color: "#6b7280" };

// ---------- CSV Export ----------
function toCSV(rows: Record<string, any>[]) {
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")].concat(
    rows.map((r) => headers.map((h) => esc(r[h])).join(","))
  );
  return lines.join("\n");
}

// ---------- Main Component ----------
export default function OnboardingClassifier() {
  return <OnboardingClassifierContent />;
}

function OnboardingClassifierContent() {
  const [inputs, setInputs] = useState<ClassifierInput>(defaultInputs());

  const [gw, setGw] = useState<GroupWeights>(defaultGroupWeights());
  const [vw, setVw] = useState<VarWeights>(defaultVarWeights());
  const [th, setTh] = useState<Thresholds>(defaultThresholds());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Presets
  const [presets, setPresets] = useState<PresetRecord[]>([]);
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const isBusy =
    loadingPresets ||
    isSavingPreset ||
    isSavingChanges ||
    isExportingPdf ||
    isExportingCsv;

  const toaster = useToaster();

  // === PRESET HELPERS — SINGLE SOURCE OF TRUTH ===
  const [lastAppliedSnapshot, setLastAppliedSnapshot] =
    useState<PresetSnapshot | null>(null);

  const activePreset = useMemo(
    () => presets.find((p) => (p.id ?? p.name) === selectedPresetId) ?? null,
    [presets, selectedPresetId],
  );

  // HELPERS: naam-controle en uniqueizer voor presets
  function nameExists(name: string, excludeId?: string) {
    return presets.some(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() &&
        (p.id ?? p.name) !== excludeId,
    );
  }
  function uniqueizeName(base: string, excludeId?: string) {
    if (!nameExists(base, excludeId)) return base;
    let i = 1;
    while (nameExists(`${base} -${i}`, excludeId)) i++;
    return `${base} -${i}`;
  }

  function createSnapshotFromPayload(
    payload: PresetPayload | null,
  ): PresetSnapshot | null {
    if (!payload?.inputs || !payload?.gw || !payload?.vw || !payload?.th) {
      return null;
    }
    return {
      inputs: JSON.parse(JSON.stringify(payload.inputs)) as Inputs,
      gw: JSON.parse(JSON.stringify(payload.gw)) as GroupWeights,
      vw: JSON.parse(JSON.stringify(payload.vw)) as VarWeights,
      th: JSON.parse(JSON.stringify(payload.th)) as Thresholds,
    };
  }

  function applySnapshot(snapshot: PresetSnapshot) {
    setInputs(snapshot.inputs);
    setGw(snapshot.gw);
    setVw(snapshot.vw);
    setTh(snapshot.th);
    setLastAppliedSnapshot(snapshot);
  }

  function applyPresetRecord(rec: PresetRecord, announce = true) {
    const snapshot = createSnapshotFromPayload(rec.data as PresetPayload);
    if (!snapshot) {
      toaster.show(
        "Preset is ongeldig (test/smoke) — niet toegepast",
        "error",
      );
      return false;
    }
    applySnapshot(snapshot);
    setPresetName(rec.name ?? "");
    if (announce) {
      toaster.show(`Toegepast: ${rec.name}`, "success");
    }
    return true;
  }

  function handleSelectPreset(id: string) {
    setSelectedPresetId(id);
    if (!id) {
      setLastAppliedSnapshot(null);
      setPresetName("");
      return;
    }
    const rec = presets.find((p) => (p.id ?? p.name) === id);
    if (rec) {
      const applied = applyPresetRecord(rec);
      if (!applied) {
        setSelectedPresetId("");
      }
    }
  }

  async function handleSavePreset() {
    if (isSavingPreset) return;
    const raw = (presetName ?? "").trim();
    if (raw.length < 3) {
      toaster.show("Naam te kort (minimaal 3 tekens)", "error");
      return;
    }
    const payload: PresetPayload = { inputs, gw, vw, th, label: "v1.0.2" };

    setIsSavingPreset(true);
    toaster.show("Opslaan…", "info");
    try {
      const finalName = uniqueizeName(raw);
      await savePreset(finalName, payload);
      const list = await refreshPresets(false);
      const created = list.find((p) => p.name === finalName);
      if (created) {
        const identifier = created.id ?? created.name;
        setSelectedPresetId(identifier);
        applyPresetRecord(created, false);
      } else {
        const snapshot = createSnapshotFromPayload(payload);
        if (snapshot) setLastAppliedSnapshot(snapshot);
      }
      setPresetName(finalName);
      toaster.show(`Preset opgeslagen ✔ (${finalName})`, "success");
    } catch (e: any) {
      console.error(e);
      toaster.show(
        `Fout bij opslaan — ${e?.message ?? "zie Console"}`,
        "error",
      );
    } finally {
      setIsSavingPreset(false);
    }
  }

  async function handleSaveChanges() {
    if (isSavingChanges) return;
    if (!selectedPresetId) {
      toaster.show("Geen preset gekozen", "error");
      return;
    }

    const typed = (presetName ?? "").trim();
    if (typed && typed.length < 3) {
      toaster.show("Naam te kort (minimaal 3 tekens)", "error");
      return;
    }

    const target = typed.length ? typed : activePreset?.name || "";
    if (target.length < 3) {
      toaster.show("Naam te kort (minimaal 3 tekens)", "error");
      return;
    }

    const payload: PresetPayload = { inputs, gw, vw, th, label: "v1.0.2" };

    setIsSavingChanges(true);
    toaster.show("Wijzigingen opslaan…", "info");
    try {
      const finalName = uniqueizeName(target, selectedPresetId);
      const res = await updatePreset(selectedPresetId, finalName, payload);
      const snapshot = createSnapshotFromPayload(payload);
      if (snapshot) {
        setLastAppliedSnapshot(snapshot);
      }
      if (res?.id) setSelectedPresetId(res.id);
      else setSelectedPresetId(finalName);
      await refreshPresets(false);
      setPresetName(finalName);
      toaster.show(`Wijzigingen opgeslagen ✔ (${finalName})`, "success");
    } catch (e: any) {
      console.error(e);
      toaster.show(
        `Fout bij wijzigen — ${e?.message ?? "zie Console"}`,
        "error",
      );
    } finally {
      setIsSavingChanges(false);
    }
  }
  // === END HELPERS ===

  async function refreshPresets(announce = true) {
    setLoadingPresets(true);
    try {
      const list = await loadPresets();
      setPresets(list);

      if (announce) {
        toaster.show(`Verversd: ${list.length} presets`, "info");
      }
      return list;
    } catch (e: any) {
      console.error(e);
      if (announce) {
        toaster.show(
          `Fout bij laden presets — ${e?.message ?? "zie Console"}`,
          "error",
        );
      }
      setPresets([]);
      return [];
    } finally {
      setLoadingPresets(false);
    }
  }

  useEffect(() => {
    refreshPresets();
  }, []);

  async function handleApplyPreset() {
    if (!selectedPresetId) {
      toaster.show("Kies een preset", "error");
      return;
    }
    const rec = presets.find((p) => (p.id ?? p.name) === selectedPresetId);
    if (!rec) {
      toaster.show("Kies een geldige preset", "error");
      return;
    }
    try {
      applyPresetRecord(rec);
    } catch (e: any) {
      console.error(e);
      toaster.show(
        `Fout bij toepassen — ${e?.message ?? "zie Console"}`,
        "error",
      );
    }
  }

  async function handleDeletePreset() {
    if (!selectedPresetId) {
      toaster.show("Geen preset gekozen", "error");
      return;
    }
    toaster.show("Verwijderen…", "info");
    try {
      const res = await deletePreset(selectedPresetId);
      setSelectedPresetId("");
      setPresetName("");
      setLastAppliedSnapshot(null);
      await refreshPresets(false);
      toaster.show(
        res.count ? `Verwijderd ✔ (${res.count})` : "Niets verwijderd",
        res.count ? "success" : "info",
      );
    } catch (e: any) {
      console.error(e);
      toaster.show(
        `Fout bij verwijderen — ${e?.message ?? "zie Console"}`,
        "error",
      );
    }
  }

  // Scenario compare (A/B) in localStorage
  const [scenarioName, setScenarioName] = useState("Scenario A");
  const [otherScenario, setOtherScenario] = useState<any | null>(() =>
    readScenarioB(),
  );

  const groupSum = Object.values(gw).reduce((a, b) => a + b, 0);
  const groupWarning = Math.abs(1 - groupSum) > 0.0001;

  // Compute scores per group and total
  const { groupScores, contributionsAll, totalScore, classification } =
    useMemo(() => {
      const entries: {
        key: GroupKey;
        score: number;
        contribs: {
          key: string;
          score: number;
          weight: number;
          contribution: number;
        }[];
      }[] = [];
      (Object.keys(groupVars) as GroupKey[]).forEach((g) => {
        const { groupScore, contributions } = computeGroupScore(g, inputs, vw);
        entries.push({ key: g, score: groupScore, contribs: contributions });
      });
      const total = entries.reduce(
        (acc, e) => acc + e.score * (gw as any)[e.key],
        0,
      );
      const contribs = entries.flatMap((e) =>
        e.contribs.map((c) => ({
          ...c,
          group: e.key,
          groupWeight: (gw as any)[e.key],
        })),
      );
      const cls = classify(total * 1, th);
      return {
        groupScores: entries,
        contributionsAll: contribs,
        totalScore: clamp(total),
        classification: cls,
      };
    }, [inputs, gw, vw, th]);

  const top3 = useMemo(() => {
    const ranked = contributionsAll
      .map((c) => ({
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

  const result = useMemo<ClassifierResult>(() => {
    const classificationLabel = `${classification.code} — ${classification.lead}`;
    return {
      totalScoreLabel: totalScore.toFixed(1),
      totalScoreProgress: clamp(totalScore),
      classification: {
        code: classification.code,
        lead: classification.lead,
        color: classification.color,
        label: classificationLabel,
      },
      topContributors: top3.map((item) => ({
        key: item.key,
        title: item.key,
        detail: `Score ${item.score.toFixed(1)} • gewicht ${item.weight.toFixed(
          2,
        )} • groep ${item.group} (${item.groupWeight.toFixed(2)})`,
      })),
      groupScores: groupScores.map((gs) => ({
        key: gs.key,
        title: gs.key,
        scoreLabel: gs.score.toFixed(1),
        progress: clamp(gs.score),
      })),
    };
  }, [classification, groupScores, top3, totalScore]);

  // Handlers

  function saveScenarioB() {
    const payload = { name: scenarioName, inputs, gw, vw, th };
    writeScenarioB(payload);
    setOtherScenario(payload);
    toaster.show("Scenario B bewaard (sessie)", "success");
  }

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const classificationCode =
        typeof classification === "string"
          ? classification
          : classification?.code ?? "n.v.t.";
      const toRow = (label: string, v: unknown): [string, string] => [
        label,
        String(v ?? ""),
      ];
      const selectedList = (options: MultiOptions) => {
        const active = Object.entries(options)
          .filter(([, isActive]) => isActive)
          .map(([key]) => key);
        return active.length ? active.join(", ") : "Geen";
      };
      const sections: PdfSection[] = [
        {
          title: "Operationele kenmerken",
          rows: [
            toRow("Aantal SKU's", inputs.skuCount),
            toRow("SKU-complexiteit", inputs.skuComplexity),
            toRow("Ordervolume/mnd (gem.)", inputs.orderVolume),
            toRow("Piekvolume", inputs.orderPeak),
            toRow("Seizoensinvloeden", inputs.seizoensinvloed),
            toRow("Retourpercentage", `${inputs.retourPercentage}%`),
            toRow("VAS-activiteiten", selectedList(inputs.vasActiviteiten)),
            toRow(
              "Inbound bijzonderheden",
              selectedList(inputs.inboundBijzonderheden),
            ),
          ],
        },
        {
          title: "Technische integratie",
          rows: [
            toRow("Platformtype", inputs.platformType),
            toRow("Type koppeling", inputs.typeKoppeling),
            toRow("PostNL API's", selectedList(inputs.postnlApis)),
            toRow("Kanalen", inputs.verzendMethoden),
          ],
        },
      ];
      const { exportPdf } = await import("./lib/exportPdf");
      exportPdf({
        presetName: (presetName || activePreset?.name || "") as string,
        classification: classificationCode,
        sections,
      });
    } catch (e: any) {
      console.error(e);
      toaster.show(
        `Fout bij PDF export — ${e?.message ?? "zie Console"}`,
        "error",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    if (isExportingCsv) return;
    setIsExportingCsv(true);
    let url: string | null = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      const row: Record<string, any> = {
        totalScore: totalScore.toFixed(1),
        class: classification.code,
        lead: classification.lead,
      };
      Object.entries(inputs).forEach(([k, v]) => {
        if (typeof v === "object" && v !== null) {
          row[k] = Object.entries(v as any)
            .filter(([, on]) => !!on)
            .map(([name]) => name)
            .join("; ");
        } else {
          row[k] = v as any;
        }
      });
      groupScores.forEach((gs) => (row[`group_${gs.key}`] = gs.score.toFixed(1)));
      const csv = toCSV([row]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "onboarding-classifier.csv";
      a.click();
    } catch (e: any) {
      console.error(e);
      toaster.show(
        `Fout bij CSV export — ${e?.message ?? "zie Console"}`,
        "error",
      );
    } finally {
      if (url) {
        URL.revokeObjectURL(url);
      }
      setIsExportingCsv(false);
    }
  };

  function resetAll() {
    setInputs(defaultInputs());
    setGw(defaultGroupWeights());
    setVw(defaultVarWeights());
    setTh(defaultThresholds());
    try {
      sessionStorage.removeItem("onb_scenario_b");
    } catch {}
    setOtherScenario(null);
    setSelectedPresetId("");
    setPresetName("");
    setLastAppliedSnapshot(null);
    toaster.show("Alles gereset (A + B)", "info");
  }

  const trimmedPresetName = (presetName ?? "").trim();
  const canSaveNewPreset = trimmedPresetName.length >= 3;
  const currentSnapshot = { inputs, gw, vw, th };
  const isDirty =
    !!selectedPresetId &&
    !!lastAppliedSnapshot &&
    !deepEqual(currentSnapshot, lastAppliedSnapshot);

  // ---------- Render ----------
  const { input } = useClassifierState();
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "24px auto",
        padding: 16,
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          Onboarding Classifier
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            aria-busy={isExportingPdf}
            style={{
              ...btnPrimary,
              cursor: isExportingPdf ? "wait" : "pointer",
              opacity: isExportingPdf ? 0.85 : 1,
            }}
          >
            {isExportingPdf ? "Bezig..." : "Export PDF"}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv}
            aria-busy={isExportingCsv}
            style={{
              ...btnPrimary,
              cursor: isExportingCsv ? "wait" : "pointer",
              opacity: isExportingCsv ? 0.85 : 1,
            }}
          >
            {isExportingCsv ? "Bezig..." : "Export CSV"}
          </button>
          <button
            onClick={saveScenarioB}
            style={{
              ...btnPrimary,
              background: "#2563eb",
            }}
          >
            Bewaar Scenario B
          </button>
          <button
            onClick={resetAll}
            style={{
              ...btnSecondary,
            }}
          >
            Reset
          </button>
        </div>
      </div>
      <PresetsCard
        presets={presets}
        selectedPresetId={selectedPresetId || null}
        onSelectPreset={handleSelectPreset}
        name={presetName}
        onNameChange={(value) => setPresetName(value)}
        onSave={handleSavePreset}
        canSave={canSaveNewPreset}
        isSavingPreset={isSavingPreset}
        loadingPresets={loadingPresets}
        onApply={handleApplyPreset}
        onDelete={handleDeletePreset}
        onRefresh={() => refreshPresets(true)}
        isDirty={isDirty}
        onSaveChanges={handleSaveChanges}
        isSavingChanges={isSavingChanges}
      />
      {/* --- EINDE PRESETS CARD --- */}

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 }}>
        {/* Left: Inputs */}
        <div>
         <InputsForm />

          <div style={{ ...card, ...section }}>
            <h2 style={h2}>Group weights</h2>
            <div style={grid3}>
              {(Object.keys(gw) as (keyof GroupWeights)[]).map((key) => (
                <div key={key}>
                  <label style={label}>
                    {key} ({(gw[key] * 100).toFixed(0)}%)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={gw[key]}
                    onChange={(e) =>
  setGw((prev: GroupWeights) => ({ ...prev, [key]: Number(e.target.value) }))
}
                  />
                </div>
              ))}
            </div>
            {groupWarning && (
              <div style={{ color: "#ef4444", marginTop: 8 }}>
                Waarschuwing: som ≠ 1.0 (nu {groupSum.toFixed(2)})
              </div>
            )}
          </div>

          <div style={{ ...card, ...section }}>
            <h2 style={h2}>Variable weights</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {(Object.keys(vw) as (keyof VarWeights)[]).map((key) => (
                <div key={key} style={{ width: 140 }}>
                  <label style={label}>
                    {key} ({(vw[key] * 100).toFixed(0)}%)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={vw[key]}
                    onChange={(e) =>
  setVw((prev: VarWeights) => ({ ...prev, [key]: Number(e.target.value) }))
}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...card, ...section }}>
            <h2 style={h2}>Thresholds</h2>
            <div style={grid3}>
              {(Object.keys(th) as (keyof Thresholds)[]).map((key) => (
                <div key={key}>
                  <label style={label}>{key}</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={100}
                    value={th[key]}
                    onChange={(e) =>
  setTh((prev: Thresholds) => ({ ...prev, [key]: Number(e.target.value) }))
}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: wrapper (alles rechts hoort in één kolom) */}
        <div>
          <ResultPanel result={result} isBusy={isBusy} />

          {/* Scenario compare */}
          <div style={{ ...card }}>
            <h2 style={h2}>Scenario-vergelijking</h2>
            <div style={{ ...small, marginBottom: 8 }}>
              Bewaar de huidige invoer als Scenario B en vergelijk.
            </div>
            <div style={grid2}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{scenarioName}</div>
                <div style={{ marginBottom: 4 }}>Score: {totalScore.toFixed(1)}</div>
                <div>Class: {classification.code} • {classification.lead}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  {otherScenario?.name ?? "Scenario B (geen)"}
                </div>
                {otherScenario ? (
                  <>
                    <div style={{ marginBottom: 4 }}>
                      Score: {(() => {
                        const scInputs = otherScenario.inputs as Inputs;
                        const scGw = otherScenario.gw as GroupWeights;
                        const scVw = otherScenario.vw as VarWeights;
                        const entries: any[] = [];
                        (Object.keys(groupVars) as GroupKey[]).forEach((g) => {
                          const r = computeGroupScore(g, scInputs, scVw);
                          entries.push({ key: g, score: r.groupScore });
                        });
                        const total = entries.reduce(
                          (acc, e) => acc + e.score * (scGw as any)[e.key],
                          0
                        );
                        return clamp(total).toFixed(1);
                      })()}
                    </div>
                    <div>
                      Class: {(() => {
                        const scInputs = otherScenario.inputs as Inputs;
                        const scGw = otherScenario.gw as GroupWeights;
                        const scVw = otherScenario.vw as VarWeights;
                        const scTh = otherScenario.th as Thresholds;
                        const entries: any[] = [];
                        (Object.keys(groupVars) as GroupKey[]).forEach((g) => {
                          const r = computeGroupScore(g, scInputs, scVw);
                          entries.push({ key: g, score: r.groupScore });
                        });
                        const total = entries.reduce(
                          (acc, e) => acc + e.score * (scGw as any)[e.key],
                          0
                        );
                        const cls = classify(total, scTh);
                        return `${cls.code} • ${cls.lead}`;
                      })()}
                    </div>
                  </>
                ) : (
                  <div style={small}>Nog geen Scenario B opgeslagen.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "right",
          marginTop: 12,
          color: "#9ca3af",
          fontSize: 12,
        }}
      >
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
