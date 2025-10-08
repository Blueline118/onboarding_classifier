export type MultiOptions = Record<string, boolean>;

export interface ClassifierInput {
  skuCount: number;
  orderVolume: number;
  orderPeak: number;
  retourPercentage: number;
  aantalAfdelingen: number;
  skuComplexity: string;
  seizoensinvloed: string;
  platformType: string;
  typeKoppeling: string;
  configDoor: string;
  mateMaatwerk: string;
  mappingComplexiteit: string;
  testCapaciteit: string;
  voorraadBeheer: string;
  replenishment: string;
  verzendMethoden: string;
  retourProces: string;
  dashboardGebruik: string;
  rapportageBehoefte: string;
  serviceUitbreiding: string;
  scopeWijzigingen: string;
  vasActiviteiten: MultiOptions;
  inboundBijzonderheden: MultiOptions;
  postnlApis: MultiOptions;
}

export interface ScoreBreakdown {
  label: string;
  value: number;
}

export interface ClassificationSummary {
  code: string;
  lead: string;
  color: string;
  label: string;
}

export interface ContributorSummary {
  key: string;
  title: string;
  detail: string;
}

export interface GroupScoreSummary {
  key: string;
  title: string;
  scoreLabel: string;
  progress: number;
}

export interface ClassifierResult {
  totalScoreLabel: string;
  totalScoreProgress: number;
  classification: ClassificationSummary;
  topContributors: ContributorSummary[];
  groupScores: GroupScoreSummary[];
}

export interface Preset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
