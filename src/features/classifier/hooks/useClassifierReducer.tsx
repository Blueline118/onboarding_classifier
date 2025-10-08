import React from "react";
import { ClassifierInput, ClassifierResult } from "../types";

/**
 * Represents the state managed by the classifier reducer.
 */
export interface ClassifierState {
  input: ClassifierInput;
  result: ClassifierResult | null;
  selectedPresetId: string | null;
  isDirty: boolean;
  isBusy: boolean;
}

/**
 * Union of actions supported by the classifier reducer.
 */
type Action =
  | { type: "SET_INPUT_PARTIAL"; patch: Partial<ClassifierInput> }
  | { type: "RECALC_RESULT"; result: ClassifierResult | null }
  | { type: "SELECT_PRESET"; id: string | null }
  | { type: "MARK_DIRTY" }
  | { type: "CLEAR_DIRTY" }
  | { type: "SET_BUSY"; value: boolean };

const ClassifierStateContext = React.createContext<ClassifierState | undefined>(undefined);
const ClassifierDispatchContext = React.createContext<React.Dispatch<Action> | undefined>(
  undefined,
);

/**
 * Creates the initial classifier input with placeholder defaults.
 */
export function createInitialInput(): ClassifierInput {
  return {
    skuCount: 0,
    orderVolume: 0,
    orderPeak: 0,
    retourPercentage: 0,
    aantalAfdelingen: 0,
    skuComplexity: "",
    seizoensinvloed: "",
    platformType: "",
    typeKoppeling: "",
    configDoor: "",
    mateMaatwerk: "",
    mappingComplexiteit: "",
    testCapaciteit: "",
    voorraadBeheer: "",
    replenishment: "",
    verzendMethoden: "",
    retourProces: "",
    dashboardGebruik: "",
    rapportageBehoefte: "",
    serviceUitbreiding: "",
    scopeWijzigingen: "",
    vasActiviteiten: {},
    inboundBijzonderheden: {},
    postnlApis: {},
  };
}

/**
 * Creates the initial classifier state used by the reducer.
 */
export function createInitialState(): ClassifierState {
  return {
    input: createInitialInput(),
    result: null,
    selectedPresetId: null,
    isDirty: false,
    isBusy: false,
  };
}

function classifierReducer(state: ClassifierState, action: Action): ClassifierState {
  switch (action.type) {
    case "SET_INPUT_PARTIAL":
      return {
        ...state,
        input: {
          ...state.input,
          ...action.patch,
        },
      };
    case "RECALC_RESULT":
      return {
        ...state,
        result: action.result,
      };
    case "SELECT_PRESET":
      return {
        ...state,
        selectedPresetId: action.id,
      };
    case "MARK_DIRTY":
      return {
        ...state,
        isDirty: true,
      };
    case "CLEAR_DIRTY":
      return {
        ...state,
        isDirty: false,
      };
    case "SET_BUSY":
      return {
        ...state,
        isBusy: action.value,
      };
    default:
      return state;
  }
}

interface ClassifierProviderProps {
  children: React.ReactNode;
}

/**
 * Provides classifier state and dispatch to descendant components.
 */
export function ClassifierProvider({ children }: ClassifierProviderProps): JSX.Element {
  const [state, dispatch] = React.useReducer(classifierReducer, undefined, createInitialState);

  return (
    <ClassifierStateContext.Provider value={state}>
      <ClassifierDispatchContext.Provider value={dispatch}>
        {children}
      </ClassifierDispatchContext.Provider>
    </ClassifierStateContext.Provider>
  );
}

/**
 * Accesses the current classifier state from context.
 */
export function useClassifierState(): ClassifierState {
  const context = React.useContext(ClassifierStateContext);
  if (context === undefined) {
    throw new Error("useClassifierState must be used within a ClassifierProvider");
  }
  return context;
}

/**
 * Describes the action helpers exposed by the classifier hook.
 */
export interface ClassifierActions {
  setInput(patch: Partial<ClassifierInput>): void;
  recalc(result: ClassifierResult | null): void;
  selectPreset(id: string | null): void;
  markDirty(): void;
  clearDirty(): void;
  setBusy(value: boolean): void;
}

/**
 * Provides type-safe action creators for interacting with the classifier reducer.
 */
export function useClassifierActions(): ClassifierActions {
  const dispatch = React.useContext(ClassifierDispatchContext);
  if (dispatch === undefined) {
    throw new Error("useClassifierActions must be used within a ClassifierProvider");
  }

  return {
    setInput(patch) {
      dispatch({ type: "SET_INPUT_PARTIAL", patch });
    },
    recalc(result) {
      dispatch({ type: "RECALC_RESULT", result });
    },
    selectPreset(id) {
      dispatch({ type: "SELECT_PRESET", id });
    },
    markDirty() {
      dispatch({ type: "MARK_DIRTY" });
    },
    clearDirty() {
      dispatch({ type: "CLEAR_DIRTY" });
    },
    setBusy(value) {
      dispatch({ type: "SET_BUSY", value });
    },
  };
}
