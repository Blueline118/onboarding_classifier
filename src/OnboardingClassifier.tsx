import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";

import { HeaderBar, InputsForm, ResultPanel, computeScore, useClassifierActions, useClassifierState } from "@/features/classifier";
import PresetsCardComponent from "./features/classifier/components/PresetsCard";
import type {
  ClassifierInput as Inputs,
  ClassifierResult,
  MultiOptions,
} from "@/features/classifier";

import type { PdfSection } from "./lib/exportPdf";
import {
  deletePreset,
  loadPresets,
  savePreset,
  updatePreset,
  type PresetPayload,
  type PresetRecord,
} from "./lib/presets";
import { useToaster } from "./components/ui/Toaster";
import { btnPrimary, btnSecondary, btnDanger } from "./ui/buttons";

// ---------- Types ----------

type NumDict = Record<string, number>;

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
  A1: number;
  A2: number;
  A3: number;
  B1: number;
  B2: number;
  C1: number;
};

interface VarWeights {
  skuCount: number;
  orderVolume: number;
  orderPeak: number;
  retourPercentage: number;
  skuComplexity: number;
  seizoensinvloed: number;
  vasActiviteiten: number;
  inboundBijzonderheden: number;
  platformType: number;
  typeKoppeling: number;
  postnlApis: number;
  configDoor: number;
  mateMaatwerk: number;
  mappingComplexiteit: number;
  testCapaciteit: number;
  aantalAfdelingen: number;
  scopeWijzigingen: number;
  voorraadBeheer: number;
  replenishment: number;
  verzendMethoden: number;
  retourProces: number;
  dashboardGebruik: number;
  rapportageBehoefte: number;
  serviceUitbreiding: number;
}

type PresetSnapshot = {
  inputs: Inputs;
  gw: GroupWeights;
  vw: VarWeights;
  th: Thresholds;
};

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

// ---------- UI styles ----------

const SCENARIO_B_KEY = "onb_scenario_b";

const sectionStyle: CSSProperties = { marginBottom: 24 };
const cardStyle: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: 16,
  boxShadow: "var(--shadow)",
};
const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--muted)",
  marginBottom: 6,
  display: "block",
};
const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "#fff",
};
const gridTwoStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};
const gridThreeStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 16,
};
const headingStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 10px",
  color: "#111827",
};
const smallTextStyle: CSSProperties = { fontSize: 12, color: "var(--muted)" };

// ---------- Helpers ----------

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((v) => stable(v));
  if (value && typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    return keys.reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = stable((value as Record<string, unknown>)[k]);
      return acc;
    }, {});
  }
  return value;
};

const deepEqual = (a: unknown, b: unknown) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

// Numeric scalers
const scaleSkuCount = (n: number) => clamp((n / 2000) * 100);
const scaleOrderVolume = (n: number) => clamp((n / 20000) * 100);
const scaleOrderPeak = (n: number) => clamp((n / 40000) * 100);
const scaleRetourPercentage = (n: number) => clamp(n);
const scaleAfdelingen = (n: number) => clamp(((n - 1) / 6) * 100);

// Categorical maps
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
const mapReplenishment: NumDict = { geautomatiseerd: 30, periodiek: 55, handmatig: 80 };
const mapVerzend: NumDict = { standaard: 25, maatwerk: 65, externe: 75 };
const mapRetourProces: NumDict = { portaal: 35, handmatig: 75 };
const mapDashboard: NumDict = { dagelijks: 20, wekelijks: 45, zelden: 70 };
const mapRapportage: NumDict = { standaard: 30, uitgebreid: 55, maatwerk: 80 };
const mapService: NumDict = { nee: 30, ja: 75 };
const mapScope: NumDict = { weinig: 30, gemiddeld: 55, veel: 80 };

const scaleMulti = (options: MultiOptions) => {
  const keys = Object.keys(options ?? {});
  if (!keys.length) return 0;
  const active = keys.filter((k) => Boolean(options?.[k])).length;
  return clamp((active / keys.length) * 100);
};

// Group definitions
const groupVariables = {
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

type GroupKey = keyof typeof groupVariables;

type GroupComputation = {
  key: GroupKey;
  score: number;
  contributions: Array<{ key: string; score: number; weight: number; contribution: number }>;
};

const variableScore = (key: keyof VarWeights, input: Inputs): number => {
  switch (key) {
    case "skuCount":
      return scaleSkuCount(input.skuCount);
    case "orderVolume":
      return scaleOrderVolume(input.orderVolume);
    case "orderPeak":
      return scaleOrderPeak(input.orderPeak);
    case "retourPercentage":
      return scaleRetourPercentage(input.retourPercentage);
    case "aantalAfdelingen":
      return scaleAfdelingen(input.aantalAfdelingen);

    case "skuComplexity":
      return mapSkuComplexity[input.skuComplexity] ?? 40;
    case "seizoensinvloed":
      return mapSeizoen[input.seizoensinvloed] ?? 45;
    case "platformType":
      return mapPlatform[input.platformType] ?? 50;
    case "typeKoppeling":
      return mapKoppeling[input.typeKoppeling] ?? 50;
    case "configDoor":
      return mapConfigDoor[input.configDoor] ?? 50;
    case "mateMaatwerk":
      return mapMaatwerk[input.mateMaatwerk] ?? 50;
    case "mappingComplexiteit":
      return mapMapping[input.mappingComplexiteit] ?? 50;
    case "testCapaciteit":
      return mapTestCap[input.testCapaciteit] ?? 50;
    case "voorraadBeheer":
      return mapVoorraad[input.voorraadBeheer] ?? 50;
    case "replenishment":
      return mapReplenishment[input.replenishment] ?? 50;
    case "verzendMethoden":
      return mapVerzend[input.verzendMethoden] ?? 50;
    case "retourProces":
      return mapRetourProces[input.retourProces] ?? 55;
    case "dashboardGebruik":
      return mapDashboard[input.dashboardGebruik] ?? 45;
    case "rapportageBehoefte":
      return mapRapportage[input.rapportageBehoefte] ?? 55;
    case "serviceUitbreiding":
      return mapService[input.serviceUitbreiding] ?? 30;

    case "vasActiviteiten":
      return scaleMulti(input.vasActiviteiten);
    case "inboundBijzonderheden":
      return scaleMulti(input.inboundBijzonderheden);
    case "postnlApis":
      return clamp(100 - scaleMulti(input.postnlApis));

    case "scopeWijzigingen":
      return mapScope[input.scopeWijzigingen] ?? 55;
    default:
      return 50;
  }
};

const computeGroupScore = (
  group: GroupKey,
  input: Inputs,
  weights: VarWeights,
): { groupScore: number; contributions: GroupComputation["contributions"] } => {
  const variables = groupVariables[group] as ReadonlyArray<keyof VarWeights>;
  let weightedSum = 0;
  let weightTotal = 0;
  const contributions = variables.map((variable) => {
    const score = variableScore(variable, input);
    const weight = weights[variable];
    weightedSum += score * weight;
    weightTotal += weight;
    return { key: variable, score, weight, contribution: score * weight };
  });
  const groupScore = weightTotal > 0 ? weightedSum / weightTotal : 0;
  return { groupScore, contributions };
};

const classify = (score: number, thresholds: Thresholds) => {
  const value = clamp(score);
  if (value <= thresholds.A1) return { code: "A1", lead: "2–3 weken", color: "#16a34a" };
  if (value <= thresholds.A2) return { code: "A2", lead: "3–4 weken", color: "#22c55e" };
  if (value <= thresholds.A3) return { code: "A3", lead: "4–6 weken", color: "#84cc16" };
  if (value <= thresholds.B1) return { code: "B1", lead: "4–5 weken", color: "#f59e0b" };
  if (value <= thresholds.B2) return { code: "B2", lead: "5–7 weken", color: "#f97316" };
  return { code: "C1", lead: "8–12 weken", color: "#ef4444" };
};

const readScenarioB = () => {
  try {
    const raw = sessionStorage.getItem(SCENARIO_B_KEY);
    return raw ? (JSON.parse(raw) as PresetSnapshot & { name?: string }) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const writeScenarioB = (snapshot: PresetSnapshot & { name?: string }) => {
  try {
    sessionStorage.setItem(SCENARIO_B_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.error(error);
  }
};

// ---------- CSV Export ----------

const toCSV = (rows: Record<string, unknown>[]) => {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escapeCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csvLines = [headers.join(",")].concat(
    rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
  );
  return csvLines.join("\n");
};

// ---------- Main Component ----------

export default function OnboardingClassifier(): JSX.Element {
  return <OnboardingClassifierContent />;
}

function OnboardingClassifierContent(): JSX.Element {
  const { setInput } = useClassifierActions();
  const { input } = useClassifierState();
  const toaster = useToaster();

  const [groupWeights, setGroupWeights] = useState<GroupWeights>(defaultGroupWeights());
  const [variableWeights, setVariableWeights] = useState<VarWeights>(defaultVarWeights());
  const [thresholds, setThresholds] = useState<Thresholds>(defaultThresholds());

  const [presets, setPresets] = useState<PresetRecord[]>([]);
  const [presetName, setPresetName] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [lastAppliedSnapshot, setLastAppliedSnapshot] = useState<PresetSnapshot | null>(null);
  const [scenarioName, setScenarioName] = useState("Scenario A");
  const [otherScenario, setOtherScenario] = useState<(PresetSnapshot & { name?: string }) | null>(() => readScenarioB());

  useEffect(() => {
    setInput(defaultInputs());
  }, [setInput]);

  useEffect(() => {
    refreshPresets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result: ClassifierResult = useMemo(() => computeScore(input), [input]);

  const isBusy = loadingPresets || isSavingPreset || isSavingChanges || isExportingPdf || isExportingCsv;

  const activePreset = useMemo(() => {
    return presets.find((preset) => (preset.id ?? preset.name) === selectedPresetId) ?? null;
  }, [presets, selectedPresetId]);

  const groupComputation = useMemo(() => {
    const groups: GroupComputation[] = (Object.keys(groupVariables) as GroupKey[]).map((group) => {
      const computation = computeGroupScore(group, input, variableWeights);
      return { key: group, score: computation.groupScore, contributions: computation.contributions };
    });
    const totalScore = groups.reduce((total, current) => total + current.score * groupWeights[current.key], 0);
    const classification = classify(totalScore, thresholds);
    return { groups, totalScore: clamp(totalScore), classification };
  }, [groupWeights, input, thresholds, variableWeights]);

  const handleGroupWeightChange = (key: keyof GroupWeights) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setGroupWeights((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }));
  };

  const handleVariableWeightChange = (key: keyof VarWeights) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setVariableWeights((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : 0 }));
  };

  const handleThresholdChange = (key: keyof Thresholds) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setThresholds((prev) => ({ ...prev, [key]: Number.isFinite(value) ? value : prev[key] }));
  };

  const handleScenarioNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setScenarioName(event.target.value);
  };

  const nameExists = (name: string, excludeId?: string) => {
    return presets.some((preset) => {
      const identifier = preset.id ?? preset.name;
      return identifier !== excludeId && preset.name.toLowerCase() === name.toLowerCase();
    });
  };

  const ensureUniqueName = (name: string, excludeId?: string) => {
    if (!nameExists(name, excludeId)) return name;
    let suffix = 1;
    while (nameExists(`${name} -${suffix}`, excludeId)) suffix += 1;
    return `${name} -${suffix}`;
  };

  const snapshotFromPayload = (payload: PresetPayload | null): PresetSnapshot | null => {
    if (!payload?.inputs || !payload?.gw || !payload?.vw || !payload?.th) return null;
    return {
      inputs: JSON.parse(JSON.stringify(payload.inputs)) as Inputs,
      gw: JSON.parse(JSON.stringify(payload.gw)) as GroupWeights,
      vw: JSON.parse(JSON.stringify(payload.vw)) as VarWeights,
      th: JSON.parse(JSON.stringify(payload.th)) as Thresholds,
    };
  };

  const applySnapshot = (snapshot: PresetSnapshot) => {
    setInput(snapshot.inputs);
    setGroupWeights(snapshot.gw);
    setVariableWeights(snapshot.vw);
    setThresholds(snapshot.th);
    setLastAppliedSnapshot(snapshot);
  };

  const applyPresetRecord = (record: PresetRecord, announce = true) => {
    const snapshot = snapshotFromPayload(record.data as PresetPayload);
    if (!snapshot) {
      toaster.show("Preset is ongeldig — niet toegepast", "error");
      return false;
    }
    applySnapshot(snapshot);
    setPresetName(record.name ?? "");
    if (announce) toaster.show(`Toegepast: ${record.name}`, "success");
    return true;
  };

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    if (!id) {
      setLastAppliedSnapshot(null);
      setPresetName("");
      return;
    }
    const record = presets.find((p) => (p.id ?? p.name) === id);
    if (record) {
      const applied = applyPresetRecord(record);
      if (!applied) setSelectedPresetId("");
    }
  };

  const refreshPresets = async (announce = true) => {
    setLoadingPresets(true);
    try {
      const list = await loadPresets();
      setPresets(list);
      if (announce) toaster.show(`Verversd: ${list.length} presets`, "info");
      return list;
    } catch (error: any) {
      console.error(error);
      if (announce) toaster.show(`Fout bij laden presets — ${error?.message ?? "zie console"}`, "error");
      setPresets([]);
      return [];
    } finally {
      setLoadingPresets(false);
    }
  };

  const handleSavePreset = async () => {
    if (isSavingPreset) return;
    const rawName = presetName.trim();
    if (rawName.length < 3) {
      toaster.show("Naam te kort (minimaal 3 tekens)", "error");
      return;
    }
    const payload: PresetPayload = { inputs: input, gw: groupWeights, vw: variableWeights, th: thresholds, label: "v1.0.2" };
    setIsSavingPreset(true);
    toaster.show("Opslaan…", "info");
    try {
      const uniqueName = ensureUniqueName(rawName);
      await savePreset(uniqueName, payload);
      const list = await refreshPresets(false);
      const created = list.find((p) => p.name === uniqueName);
      if (created) {
        const identifier = created.id ?? created.name;
        setSelectedPresetId(identifier);
        applyPresetRecord(created, false);
      } else {
        const snapshot = snapshotFromPayload(payload);
        if (snapshot) setLastAppliedSnapshot(snapshot);
      }
      setPresetName(uniqueName);
      toaster.show(`Preset opgeslagen ✔ (${uniqueName})`, "success");
    } catch (error: any) {
      console.error(error);
      toaster.show(`Fout bij opslaan — ${error?.message ?? "zie console"}`, "error");
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleSaveChanges = async () => {
    if (isSavingChanges) return;
    if (!selectedPresetId) {
      toaster.show("Geen preset gekozen", "error");
      return;
    }
    const trimmed = presetName.trim();
    if (trimmed && trimmed.length < 3) {
      toaster.show("Naam te kort (minimaal 3 tekens)", "error");
      return;
    }
    const baseName = trimmed.length ? trimmed : activePreset?.name ?? "";
    if (baseName.length < 3) {
      toaster.show("Naam te kort (minimaal 3 tekens)", "error");
      return;
    }
    const payload: PresetPayload = { inputs: input, gw: groupWeights, vw: variableWeights, th: thresholds, label: "v1.0.2" };
    setIsSavingChanges(true);
    toaster.show("Wijzigingen opslaan…", "info");
    try {
      const finalName = ensureUniqueName(baseName, selectedPresetId);
      const snapshot = snapshotFromPayload(payload);
      const result = await updatePreset(selectedPresetId, finalName, payload);
      if (snapshot) setLastAppliedSnapshot(snapshot);
      if (result?.id) setSelectedPresetId(result.id); else setSelectedPresetId(finalName);
      await refreshPresets(false);
      setPresetName(finalName);
      toaster.show(`Wijzigingen opgeslagen ✔ (${finalName})`, "success");
    } catch (error: any) {
      console.error(error);
      toaster.show(`Fout bij wijzigen — ${error?.message ?? "zie console"}`, "error");
    } finally {
      setIsSavingChanges(false);
    }
  };

  const handleApplyPreset = async () => {
    if (!selectedPresetId) {
      toaster.show("Kies een preset", "error");
      return;
    }
    const record = presets.find((p) => (p.id ?? p.name) === selectedPresetId);
    if (!record) {
      toaster.show("Kies een geldige preset", "error");
      return;
    }
    try {
      applyPresetRecord(record);
    } catch (error: any) {
      console.error(error);
      toaster.show(`Fout bij toepassen — ${error?.message ?? "zie console"}`, "error");
    }
  };

  const handleDeletePreset = async () => {
    if (!selectedPresetId) {
      toaster.show("Geen preset gekozen", "error");
      return;
    }
    toaster.show("Verwijderen…", "info");
    try {
      const response = await deletePreset(selectedPresetId);
      setSelectedPresetId("");
      setPresetName("");
      setLastAppliedSnapshot(null);
      await refreshPresets(false);
      toaster.show(response.count ? `Verwijderd ✔ (${response.count})` : "Niets verwijderd", response.count ? "success" : "info");
    } catch (error: any) {
      console.error(error);
      toaster.show(`Fout bij verwijderen — ${error?.message ?? "zie console"}`, "error");
    }
  };

  const saveScenarioB = () => {
    const snapshot: PresetSnapshot & { name?: string } = {
      name: scenarioName,
      inputs: input,
      gw: groupWeights,
      vw: variableWeights,
      th: thresholds,
    };
    writeScenarioB(snapshot);
    setOtherScenario(snapshot);
    toaster.show("Scenario B bewaard (sessie)", "success");
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const classificationCode =
        typeof groupComputation.classification === "string"
          ? groupComputation.classification
          : groupComputation.classification?.code ?? "n.v.t.";
      const selectedList = (options: MultiOptions) => {
        const active = Object.entries(options ?? {})
          .filter(([, enabled]) => Boolean(enabled))
          .map(([key]) => key);
        return active.length ? active.join(", ") : "Geen";
      };
      const toRow = (label: string, value: unknown): [string, string] => [label, String(value ?? "")];

      const sections: PdfSection[] = [
        {
          title: "Operationele kenmerken",
          rows: [
            toRow("Aantal SKU's", input.skuCount),
            toRow("Ordervolume", input.orderVolume),
            toRow("Orderpiek", input.orderPeak),
            toRow("Retourpercentage", `${input.retourPercentage}%`),
            toRow("SKU-complexiteit", input.skuComplexity),
            toRow("Seizoensinvloed", input.seizoensinvloed),
          ],
        },
        {
          title: "Technisch & configuratie",
          rows: [
            toRow("Platformtype", input.platformType),
            toRow("Type koppeling", input.typeKoppeling),
            toRow("PostNL API's", selectedList(input.postnlApis)),
            toRow("Configuratie door", input.configDoor),
            toRow("Mate van maatwerk", input.mateMaatwerk),
          ],
        },
        {
          title: "Organisatie & processen",
          rows: [
            toRow("Afdelingen", input.aantalAfdelingen),
            toRow("Scope wijzigingen", input.scopeWijzigingen),
            toRow("Voorraadbeheer", input.voorraadBeheer),
            toRow("Replenishment", input.replenishment),
            toRow("Verzendmethoden", input.verzendMethoden),
            toRow("Retourproces", input.retourProces),
          ],
        },
      ];
      const { exportPdf } = await import("./lib/exportPdf");
      exportPdf({ presetName: (presetName || activePreset?.name || "") as string, classification: classificationCode, sections });
    } catch (error: any) {
      console.error(error);
      toaster.show(`Fout bij PDF export — ${error?.message ?? "zie console"}`, "error");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    if (isExportingCsv) return;
    setIsExportingCsv(true);
    let blobUrl: string | null = null;
    try {
      const row: Record<string, unknown> = {
        totalScore: groupComputation.totalScore.toFixed(1),
        class: groupComputation.classification.code,
        lead: groupComputation.classification.lead,
      };
      Object.entries(input).forEach(([key, value]) => {
        if (value && typeof value === "object") {
          const active = Object.entries(value as Record<string, boolean>)
            .filter(([, enabled]) => Boolean(enabled))
            .map(([option]) => option)
            .join("; ");
          row[key] = active;
        } else {
          row[key] = value as unknown;
        }
      });
      groupComputation.groups.forEach((group) => {
        row[`group_${group.key}`] = group.score.toFixed(1);
      });
      const csv = toCSV([row]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = "onboarding-classifier.csv";
      anchor.click();
    } catch (error: any) {
      console.error(error);
      toaster.show(`Fout bij CSV export — ${error?.message ?? "zie console"}`, "error");
    } finally {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setIsExportingCsv(false);
    }
  };

  const resetAll = () => {
    setInput(defaultInputs());
    setGroupWeights(defaultGroupWeights());
    setVariableWeights(defaultVarWeights());
    setThresholds(defaultThresholds());
    try {
      sessionStorage.removeItem(SCENARIO_B_KEY);
    } catch (error) {
      console.error(error);
    }
    setOtherScenario(null);
    setSelectedPresetId("");
    setPresetName("");
    setLastAppliedSnapshot(null);
    toaster.show("Alles gereset (A + B)", "info");
  };

  const groupWeightSum = Object.values(groupWeights).reduce((sum, value) => sum + value, 0);
  const groupWeightWarning = Math.abs(1 - groupWeightSum) > 0.0001;

  const trimmedPresetName = presetName.trim();
  const canSaveNewPreset = trimmedPresetName.length >= 3;
  const currentSnapshot = { inputs: input, gw: groupWeights, vw: variableWeights, th: thresholds };
  const isDirty = Boolean(selectedPresetId) && Boolean(lastAppliedSnapshot) && !deepEqual(currentSnapshot, lastAppliedSnapshot);

  return (
    <div className="oc-container">
      <HeaderBar
        title="Onboarding Classifier"
        leftSlot={
          <input
            aria-label="Naam van scenario A"
            value={scenarioName}
            onChange={handleScenarioNameChange}
            style={{ ...inputStyle, width: 200 }}
          />
        }
        rightSlot={
          <>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              aria-busy={isExportingPdf}
              style={{ ...btnPrimary, cursor: isExportingPdf ? "wait" : "pointer", opacity: isExportingPdf ? 0.85 : 1 }}
            >
              {isExportingPdf ? "Bezig..." : "Export PDF"}
            </button>
            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              aria-busy={isExportingCsv}
              style={{ ...btnPrimary, cursor: isExportingCsv ? "wait" : "pointer", opacity: isExportingCsv ? 0.85 : 1 }}
            >
              {isExportingCsv ? "Bezig..." : "Export CSV"}
            </button>
            <button onClick={saveScenarioB} style={{ ...btnPrimary, background: "#2563eb" }}>
              Bewaar Scenario B
            </button>
            <button onClick={resetAll} style={{ ...btnSecondary }}>
              Reset
            </button>
          </>
        }
      />

      <PresetsCardComponent
        presets={presets}
        selectedPresetId={selectedPresetId || null}
        onSelectPreset={handleSelectPreset}
        name={presetName}
        onNameChange={(v) => setPresetName(v)}
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

      <div className="oc-grid">
        <div>
          <InputsForm />

          <div style={{ ...cardStyle, ...sectionStyle }}>
            <h2 style={headingStyle}>Group weights</h2>
            <div style={gridThreeStyle}>
              {(Object.keys(groupWeights) as Array<keyof GroupWeights>).map((key) => (
                <div key={key}>
                  <label style={labelStyle}>
                    {key} ({(groupWeights[key] * 100).toFixed(0)}%)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={groupWeights[key]}
                    onChange={handleGroupWeightChange(key)}
                  />
                </div>
              ))}
            </div>
            {groupWeightWarning ? (
              <div style={{ color: "#ef4444", marginTop: 8 }}>
                Waarschuwing: som ≠ 1.0 (nu {groupWeightSum.toFixed(2)})
              </div>
            ) : null}
          </div>

          <div style={{ ...cardStyle, ...sectionStyle }}>
            <h2 style={headingStyle}>Variable weights</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {(Object.keys(variableWeights) as Array<keyof VarWeights>).map((key) => (
                <div key={key} style={{ width: 140 }}>
                  <label style={labelStyle}>
                    {key} ({(variableWeights[key] * 100).toFixed(0)}%)
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={variableWeights[key]}
                    onChange={handleVariableWeightChange(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, ...sectionStyle }}>
            <h2 style={headingStyle}>Thresholds</h2>
            <div style={gridThreeStyle}>
              {(Object.keys(thresholds) as Array<keyof Thresholds>).map((key) => (
                <div key={key}>
                  <label style={labelStyle}>{key}</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={100}
                    value={thresholds[key]}
                    onChange={handleThresholdChange(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <ResultPanel result={result} isBusy={isBusy} />

          <div style={{ ...cardStyle }}>
            <h2 style={headingStyle}>Scenario-vergelijking</h2>
            <div style={{ ...smallTextStyle, marginBottom: 8 }}>Bewaar de huidige invoer als Scenario B en vergelijk.</div>
            <div style={gridTwoStyle}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{scenarioName}</div>
                <div style={{ marginBottom: 4 }}>Score: {groupComputation.totalScore.toFixed(1)}</div>
                <div>
                  Class: {groupComputation.classification.code} • {groupComputation.classification.lead}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{otherScenario?.name ?? "Scenario B (geen)"}</div>
                {otherScenario ? (
                  <>
                    <div style={{ marginBottom: 4 }}>
                      Score:{" "}
                      {(() => {
                        const entries: Array<{ key: GroupKey; score: number }> = [];
                        (Object.keys(groupVariables) as GroupKey[]).forEach((group) => {
                          const r = computeGroupScore(group, otherScenario.inputs as Inputs, otherScenario.vw as VarWeights);
                          entries.push({ key: group, score: r.groupScore });
                        });
                        const total = entries.reduce((acc, e) => acc + e.score * (otherScenario.gw as any)[e.key], 0);
                        return clamp(total).toFixed(1);
                      })()}
                    </div>
                    <div>
                      Class:{" "}
                      {(() => {
                        const entries: Array<{ key: GroupKey; score: number }> = [];
                        (Object.keys(groupVariables) as GroupKey[]).forEach((group) => {
                          const r = computeGroupScore(group, otherScenario.inputs as Inputs, otherScenario.vw as VarWeights);
                          entries.push({ key: group, score: r.groupScore });
                        });
                        const total = entries.reduce((acc, e) => acc + e.score * (otherScenario.gw as any)[e.key], 0);
                        const classification = classify(total, otherScenario.th as Thresholds);
                        return `${classification.code} • ${classification.lead}`;
                      })()}
                    </div>
                  </>
                ) : (
                  <div style={smallTextStyle}>Nog geen Scenario B opgeslagen.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: "right", marginTop: 12, color: "#9ca3af", fontSize: 12 }}>v1.0.0 — Onboarding Classifier</div>
    </div>
  );
}
