import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ChangeEvent } from "react";

import type { ClassifierInput } from "../types";
import { useClassifierActions, useClassifierState } from "../hooks/useClassifierReducer";

type NumericField =
  | "skuCount"
  | "orderVolume"
  | "orderPeak"
  | "retourPercentage"
  | "aantalAfdelingen";

type MultiField = "vasActiviteiten" | "inboundBijzonderheden" | "postnlApis";

type SelectField = Exclude<keyof ClassifierInput, NumericField | MultiField>;

const numericFields: Array<{
  key: NumericField;
  label: string;
  min?: number;
  max?: number;
  step?: number;
}> = [
  { key: "skuCount", label: "Aantal SKU's", min: 0 },
  { key: "orderVolume", label: "Ordervolume / maand", min: 0 },
  { key: "orderPeak", label: "Orderpiek / maand", min: 0 },
  { key: "retourPercentage", label: "Retourpercentage %", min: 0, max: 100, step: 0.1 },
  { key: "aantalAfdelingen", label: "Aantal afdelingen (klantzijde)", min: 0 },
];

const selectFieldGroups: Array<{
  title: string;
  fields: Array<{
    key: SelectField;
    label: string;
    options: readonly string[];
  }>;
}> = [
  {
    title: "Operationeel",
    fields: [
      { key: "skuComplexity", label: "SKU-complexiteit", options: ["", "standaard", "varianten", "bundels"] },
      { key: "seizoensinvloed", label: "Seizoensinvloed", options: ["", "laag", "medium", "hoog"] },
      { key: "scopeWijzigingen", label: "Scope wijzigingen", options: ["", "weinig", "gemiddeld", "veel"] },
    ],
  },
  {
    title: "Technisch",
    fields: [
      {
        key: "platformType",
        label: "Platformtype",
        options: ["", "Shopify", "Magento", "WooCommerce", "Lightspeed", "Bol.com", "API"],
      },
      { key: "typeKoppeling", label: "Type koppeling", options: ["", "API", "SFTP", "plugin", "handmatig"] },
    ],
  },
  {
    title: "Configuratie",
    fields: [
      { key: "configDoor", label: "Configuratie door", options: ["", "klant", "postnl", "hybride"] },
      { key: "mateMaatwerk", label: "Mate van maatwerk", options: ["", "geen", "licht", "zwaar"] },
      { key: "mappingComplexiteit", label: "Mapping-complexiteit", options: ["", "standaard", "custom", "dynamisch"] },
      { key: "testCapaciteit", label: "Testcapaciteit (klant)", options: ["", "laag", "gemiddeld", "hoog"] },
    ],
  },
  {
    title: "Processen",
    fields: [
      { key: "voorraadBeheer", label: "Voorraadbeheer", options: ["", "realtime", "batch", "handmatig"] },
      { key: "replenishment", label: "Replenishment", options: ["", "geautomatiseerd", "periodiek", "handmatig"] },
      { key: "verzendMethoden", label: "Verzendmethoden", options: ["", "standaard", "maatwerk", "externe"] },
      { key: "retourProces", label: "Retourproces", options: ["", "portaal", "handmatig"] },
    ],
  },
  {
    title: "Rapportage",
    fields: [
      { key: "dashboardGebruik", label: "Dashboardgebruik", options: ["", "dagelijks", "wekelijks", "zelden"] },
      { key: "rapportageBehoefte", label: "Rapportagebehoefte", options: ["", "standaard", "uitgebreid", "maatwerk"] },
    ],
  },
  {
    title: "Contract",
    fields: [
      { key: "serviceUitbreiding", label: "Service-uitbreiding", options: ["", "nee", "ja"] },
    ],
  },
];

const multiFieldLabels: Record<MultiField, string> = {
  vasActiviteiten: "VAS-activiteiten",
  inboundBijzonderheden: "Inbound bijzonderheden",
  postnlApis: "PostNL API's",
};

const multiFieldOptions: Record<MultiField, readonly string[]> = {
  vasActiviteiten: ["stickeren", "bundelen", "inspectie", "labelen", "sets bouwen"],
  inboundBijzonderheden: [
    "kwaliteitscontrole",
    "afwijkende verpakking",
    "barcodering",
    "douane-documentatie",
  ],
  postnlApis: ["Locatie", "Checkout", "Retour", "Track & Trace", "Order Management"],
};

const checkboxGroupStyle: CSSProperties = { marginTop: 8 };

export default function InputsForm(): JSX.Element {
  const { input } = useClassifierState();
  const { setInput } = useClassifierActions();

    const [mounted, setMounted] = useState(false);
  const [derivedMultiOptions, setDerivedMultiOptions] = useState<Record<MultiField, string[]>>(() => ({
    vasActiviteiten: [...multiFieldOptions.vasActiviteiten],
    inboundBijzonderheden: [...multiFieldOptions.inboundBijzonderheden],
    postnlApis: [...multiFieldOptions.postnlApis],
  }));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const next: Record<MultiField, string[]> = {
      vasActiviteiten: [],
      inboundBijzonderheden: [],
      postnlApis: [],
    };
    (Object.keys(next) as MultiField[]).forEach((group) => {
      const seen = new Set<string>();
      multiFieldOptions[group].forEach((option) => {
        if (!seen.has(option)) {
          seen.add(option);
          next[group].push(option);
        }
      });
      Object.keys(input[group] ?? {}).forEach((option) => {
        if (!seen.has(option)) {
          seen.add(option);
          next[group].push(option);
        }
      });
    });
    setDerivedMultiOptions(next);
  }, [input]);

  const memoizedNumericFields = useMemo(() => numericFields, []);
  const memoizedSelectGroups = useMemo(() => selectFieldGroups, []);

  const updateInput = <K extends keyof ClassifierInput>(key: K, value: ClassifierInput[K]) => {
    setInput({ [key]: value } as Pick<ClassifierInput, K>);
  };

  const handleNumberChange = (field: NumericField) => (event: ChangeEvent<HTMLInputElement>) => {
    updateInput(field, Number(event.target.value) || 0);
  };

  const handleSelectChange = (field: SelectField) => (event: ChangeEvent<HTMLSelectElement>) => {
    updateInput(field, event.target.value);
  };

  const handleMultiToggle = (group: MultiField, option: string) => {
    const current = input[group];
    const next = {
      ...current,
      [option]: !current?.[option],
    };
    updateInput(group, next);
  };

  return (
    <div data-mounted={mounted}>
      <div className="card oc-card">
        <div className="oc-section">
          <h2>Basiskenmerken</h2>
          <div className="oc-fieldgrid">
            {memoizedNumericFields.map(({ key, label, min, max, step }) => {
              const fieldId = `numeric-${key}`;
              return (
                <div key={key} className="oc-field">
                  <label htmlFor={fieldId}>{label}</label>
                  <input
                    id={fieldId}
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={input[key] ?? 0}
                    onChange={handleNumberChange(key)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {memoizedSelectGroups.map(({ title, fields }) => (
        <div key={title} className="card oc-card">
          <div className="oc-section">
            <h2>{title}</h2>
            <div className="oc-fieldgrid">
              {fields.map(({ key, label, options }) => {
                const fieldId = `select-${key}`;
                return (
                  <div key={key} className="oc-field">
                    <label htmlFor={fieldId}>{label}</label>
                    <select
                      id={fieldId}
                      value={input[key] ?? ""}
                      onChange={handleSelectChange(key)}
                    >
                      {options.map((option) => (
                        <option key={option || "__empty"} value={option}>
                          {option ? option : "Maak een keuze"}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {(Object.keys(multiFieldLabels) as MultiField[]).map((group) => (
        <div key={group} className="card oc-card">
          <div className="oc-section">
            <h2>{multiFieldLabels[group]}</h2>
            <div className="checkgroup" style={checkboxGroupStyle}>
              {derivedMultiOptions[group].map((option) => (
                <label key={option}>
                  <input
                    type="checkbox"
                    checked={Boolean(input[group]?.[option])}
                    onChange={() => handleMultiToggle(group, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
