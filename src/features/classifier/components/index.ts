export { default as HeaderBar } from "./components/HeaderBar";
export { default as PresetsCard } from "./components/PresetsCard";
export { default as InputsForm } from "./components/InputsForm";
export { default as ResultPanel } from "./components/ResultPanel";
export { default as ScenarioCompare } from "./components/ScenarioCompare";

export type {
  ClassifierInput,
  MultiOptions,
  ScoreBreakdown,
  ClassifierResult,
  Preset,
} from "./types";

export { computeScore } from "./services/computeScore";
export {
  listPresets,
  createPreset,
  updatePreset,
  deletePreset,
} from "./services/presetsStore";