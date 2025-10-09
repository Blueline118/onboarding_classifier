import type { ClassifierInput, ClassifierResult } from "../types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const scaleSkuCount = (value: number) => clamp((value / 2000) * 100);
const scaleOrderVolume = (value: number) => clamp((value / 20000) * 100);
const scaleOrderPeak = (value: number) => clamp((value / 40000) * 100);
const scaleRetourPercentage = (value: number) => clamp(value);
const scaleAfdelingen = (value: number) => clamp(((value - 1) / 6) * 100);

const OPTION_SCORES = {
  skuComplexity: { standaard: 10, varianten: 50, bundels: 80 },
  seizoensinvloed: { laag: 10, medium: 45, hoog: 80 },
  platformType: { Shopify: 20, Magento: 60, WooCommerce: 40, Lightspeed: 25, "Bol.com": 50 },
  typeKoppeling: { API: 70, SFTP: 40, plugin: 30, handmatig: 80 },
  configDoor: { klant: 60, postnl: 30, hybride: 50 },
  mateMaatwerk: { geen: 10, licht: 45, zwaar: 85 },
  mappingComplexiteit: { standaard: 20, custom: 60, dynamisch: 80 },
  testCapaciteit: { laag: 80, gemiddeld: 45, hoog: 20 },
  voorraadBeheer: { realtime: 30, batch: 55, handmatig: 85 },
  replenishment: { geautomatiseerd: 30, periodiek: 55, handmatig: 80 },
  verzendMethoden: { standaard: 25, maatwerk: 65, externe: 75 },
  retourProces: { portaal: 35, handmatig: 75 },
  dashboardGebruik: { dagelijks: 20, wekelijks: 45, zelden: 70 },
  rapportageBehoefte: { standaard: 30, uitgebreid: 55, maatwerk: 80 },
  serviceUitbreiding: { nee: 30, ja: 75 },
  scopeWijzigingen: { weinig: 30, gemiddeld: 55, veel: 80 },
} as const;

type OptionScoreKey = keyof typeof OPTION_SCORES;

type MultiOption = Record<string, boolean> | undefined | null;

const scaleMulti = (options: MultiOption) => {
  const entries = Object.entries(options ?? {});
  if (!entries.length) return 0;
  const active = entries.filter(([, value]) => Boolean(value)).length;
  return clamp((active / entries.length) * 100);
};

const GROUP_VARIABLES = {
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

type GroupKey = keyof typeof GROUP_VARIABLES;

const GROUP_TITLES: Record<GroupKey, string> = {
  operationeel: "Operationeel",
  technisch: "Technisch",
  configuratie: "Configuratie",
  organisatie: "Organisatie",
  processen: "Processen",
  rapportage: "Rapportage",
  contract: "Contract",
};

const GROUP_WEIGHTS: Record<GroupKey, number> = {
  operationeel: 0.25,
  technisch: 0.15,
  configuratie: 0.15,
  organisatie: 0.14,
  processen: 0.11,
  rapportage: 0.1,
  contract: 0.1,
};

type Contribution = {
  key: string;
  score: number;
  weight: number;
  contribution: number;
};

type GroupComputation = {
  key: GroupKey;
  score: number;
  contributions: Contribution[];
};

const getOptionScore = (key: OptionScoreKey, value: string) => {
  const table = OPTION_SCORES[key] as Record<string, number>;
  return table[value] ?? 50;
};

const scoreVariable = (key: string, input: ClassifierInput): number => {
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
    case "seizoensinvloed":
    case "platformType":
    case "typeKoppeling":
    case "configDoor":
    case "mateMaatwerk":
    case "mappingComplexiteit":
    case "testCapaciteit":
    case "voorraadBeheer":
    case "replenishment":
    case "verzendMethoden":
    case "retourProces":
    case "dashboardGebruik":
    case "rapportageBehoefte":
    case "serviceUitbreiding":
    case "scopeWijzigingen":
const value = (input as any)[key]; // tolerant index access
return getOptionScore(key as OptionScoreKey, value);

    case "vasActiviteiten":
      return scaleMulti(input.vasActiviteiten);
    case "inboundBijzonderheden":
      return scaleMulti(input.inboundBijzonderheden);
    case "postnlApis":
      return clamp(100 - scaleMulti(input.postnlApis));
    default:
      return 50;
  }
};

const computeGroupScore = (group: GroupKey, input: ClassifierInput): GroupComputation => {
  const variables = GROUP_VARIABLES[group];
  const weight = 1 / variables.length;
  let total = 0;
  const contributions: Contribution[] = variables.map(variable => {
    const score = scoreVariable(variable, input);
    const contribution = score * weight;
    total += contribution;
    return { key: variable, score, weight, contribution };
  });
  return { key: group, score: total, contributions };
};

const classify = (value: number) => {
  const score = clamp(value);
  if (score <= 20) return { code: "A1", lead: "2–3 weken", color: "#16a34a" };
  if (score <= 35) return { code: "A2", lead: "3–4 weken", color: "#22c55e" };
  if (score <= 50) return { code: "A3", lead: "4–6 weken", color: "#84cc16" };
  if (score <= 65) return { code: "B1", lead: "4–5 weken", color: "#f59e0b" };
  if (score <= 80) return { code: "B2", lead: "5–7 weken", color: "#f97316" };
  return { code: "C1", lead: "8–12 weken", color: "#ef4444" };
};

export function computeScore(input: ClassifierInput): ClassifierResult {
  const groupComputations = (Object.keys(GROUP_VARIABLES) as GroupKey[]).map(group =>
    computeGroupScore(group, input)
  );

  const totalScore = groupComputations.reduce(
    (accumulator, group) => accumulator + group.score * (GROUP_WEIGHTS[group.key] ?? 0),
    0
  );

  const classification = classify(totalScore);

  const allContributions = groupComputations.flatMap(group =>
    group.contributions.map(contribution => ({
      group: group.key,
      groupWeight: GROUP_WEIGHTS[group.key],
      ...contribution,
    }))
  );

  const topContributors = allContributions
    .map(item => ({
      ...item,
      magnitude: Math.abs(item.contribution * item.groupWeight),
    }))
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 3)
    .map(item => ({
      key: item.key,
      title: item.key,
      detail: `Score ${item.score.toFixed(1)} • gewicht ${item.weight.toFixed(2)} • groep ${GROUP_TITLES[item.group]} (${item.groupWeight.toFixed(2)})`,
    }));

  const groupScores = groupComputations.map(group => ({
    key: group.key,
    title: GROUP_TITLES[group.key],
    scoreLabel: group.score.toFixed(1),
    progress: clamp(group.score),
  }));

  return {
    totalScoreLabel: totalScore.toFixed(1),
    totalScoreProgress: clamp(totalScore),
    classification: {
      ...classification,
      label: `${classification.code} — ${classification.lead}`,
    },
    topContributors,
    groupScores,
  };
}