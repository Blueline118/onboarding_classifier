import { Preset } from "../types";

export const listPresets = async (): Promise<Preset[]> => {
  // TODO: Provide real preset listing implementation
  throw new Error("listPresets is not implemented yet");
};

export const createPreset = async (preset: Preset): Promise<Preset> => {
  // TODO: Persist new preset and return stored value
  throw new Error("createPreset is not implemented yet");
};

export const updatePreset = async (preset: Preset): Promise<Preset> => {
  // TODO: Update existing preset and return updated value
  throw new Error("updatePreset is not implemented yet");
};

export const deletePreset = async (presetId: string): Promise<void> => {
  // TODO: Remove preset by identifier
  throw new Error("deletePreset is not implemented yet");
};