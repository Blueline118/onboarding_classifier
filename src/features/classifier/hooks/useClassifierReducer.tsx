import React, { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import type { ClassifierInput } from "../types";

/** ----------------------------------------------------------------
 *  Lokale, veilige defaults (voorkomt barrel-cirkel & runtime nulls)
 *  Sluit aan op onze huidige InputsForm/select-waardes.
 *  ---------------------------------------------------------------- */
function defaultInputs(): ClassifierInput {
  return {
    skuCount: 0,
    orderVolume: 0,
    orderPeak: 0,
    retourPercentage: 0,
    aantalAfdelingen: 0,
    skuComplexity: "standaard",
    seizoensinvloed: "laag",
    platformType: "Magento",
    typeKoppeling: "API",
    configDoor: "postnl",
    mateMaatwerk: "geen",
    mappingComplexiteit: "standaard",
    testCapaciteit: "laag",
    voorraadBeheer: "realtime",
    replenishment: "handmatig",
    verzendMethoden: "standaard",
    retourProces: "portaal",
    dashboardGebruik: "dagelijks",
    rapportageBehoefte: "standaard",
    serviceUitbreiding: "nee",
    scopeWijzigingen: "gemiddeld",
    vasActiviteiten: { stickeren: false, bundelen: false, inspectie: false },
    inboundBijzonderheden: {
      kwaliteitscontrole: false,
      "afwijkende verpakking": false,
      barcodering: false,
    },
    postnlApis: {
      Locatie: false,
      Checkout: false,
      Retour: false,
      "Track & Trace": false,
    },
  };
}

/** -----------------------------
 *  State, Actions, Reducer
 *  ----------------------------- */
export interface ClassifierState {
  input: ClassifierInput;
  isBusy: boolean;
}

type Action =
  | { type: "SET_INPUT"; patch: Partial<ClassifierInput> }
  | { type: "SET_BUSY"; flag: boolean };

const initialState: ClassifierState = {
  input: defaultInputs(),
  isBusy: false,
};

function reducer(state: ClassifierState, action: Action): ClassifierState {
  switch (action.type) {
    case "SET_INPUT":
      return { ...state, input: { ...state.input, ...action.patch } };
    case "SET_BUSY":
      return { ...state, isBusy: action.flag };
    default:
      return state;
  }
}

/** -----------------------------
 *  Contexts + Provider
 *  ----------------------------- */
const StateCtx = createContext<ClassifierState | undefined>(undefined);

type Actions = {
  setInput: (patch: Partial<ClassifierInput>) => void;
  setBusy: (flag: boolean) => void;
};

const ActionsCtx = createContext<Actions | undefined>(undefined);

export function ClassifierProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo<Actions>(
    () => ({
      setInput: (patch: Partial<ClassifierInput>) =>
        dispatch({ type: "SET_INPUT", patch }),
      setBusy: (flag: boolean) => dispatch({ type: "SET_BUSY", flag }),
    }),
    []
  );

  return (
    <StateCtx.Provider value={state}>
      <ActionsCtx.Provider value={actions}>{children}</ActionsCtx.Provider>
    </StateCtx.Provider>
  );
}

/** -----------------------------
 *  Hooks
 *  ----------------------------- */
export function useClassifierState(): ClassifierState {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("useClassifierState must be used within a ClassifierProvider");
  return ctx;
}

export function useClassifierActions(): Actions {
  const ctx = useContext(ActionsCtx);
  if (!ctx) throw new Error("useClassifierActions must be used within a ClassifierProvider");
  return ctx;
}
