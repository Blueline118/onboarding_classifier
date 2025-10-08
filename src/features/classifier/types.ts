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
  // TODO: Define score breakdown details
}

export interface ClassifierResult {
  // TODO: Define classifier result structure
}

export interface Preset {
  // TODO: Define classifier preset shape
}
