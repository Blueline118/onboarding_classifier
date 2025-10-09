import { ChangeEvent, useMemo } from "react";
import type { CSSProperties } from "react";
import type { ClassifierInput } from "@/features/classifier";
import { useClassifierActions, useClassifierState } from "@/features/classifier";

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

const sectionStyle: CSSProperties = {
  marginBottom: 24,
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  backgroundColor: "#fff",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 18,
  fontWeight: 600,
  color: "#111827",
};

const fieldLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  color: "#374151",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
};

const inputStyle: CSSProperties = {
  borderRadius: 8,
  border: "1px solid #d1d5db",
  padding: "8px 10px",
  fontSize: 14,
  color: "#111827",
};

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  color: "#1f2937",
};

export default function InputsForm(): JSX.Element {
  const { input } = useClassifierState();
  const { setInput } = useClassifierActions();

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

  const derivedMultiOptions = useMemo(() => {
    const groups: Record<MultiField, string[]> = {
      vasActiviteiten: [],
      inboundBijzonderheden: [],
      postnlApis: [],
    };

    (Object.keys(groups) as MultiField[]).forEach((group) => {
      const seen = new Set<string>();
      const ordered: string[] = [];
      const predefined = multiFieldOptions[group];
      predefined.forEach((option) => {
        if (!seen.has(option)) {
          seen.add(option);
          ordered.push(option);
        }
      });
      Object.keys(input[group] ?? {}).forEach((option) => {
        if (!seen.has(option)) {
          seen.add(option);
          ordered.push(option);
        }
      });
      groups[group] = ordered;
    });

    return groups;
  }, [input]);

  return (
    <div>
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Basiskenmerken</h2>
        <div style={gridStyle}>
          {numericFields.map(({ key, label, min, max, step }) => (
            <label key={key} style={fieldLabelStyle}>
              <span>{label}</span>
              <input
                type="number"
                min={min}
                max={max}
                step={step}
                value={input[key] ?? 0}
                onChange={handleNumberChange(key)}
                style={inputStyle}
              />
            </label>
          ))}
        </div>
      </div>

      {selectFieldGroups.map(({ title, fields }) => (
        <div key={title} style={sectionStyle}>
          <h2 style={sectionTitleStyle}>{title}</h2>
          <div style={gridStyle}>
            {fields.map(({ key, label, options }) => (
              <label key={key} style={fieldLabelStyle}>
                <span>{label}</span>
                <select value={input[key] ?? ""} onChange={handleSelectChange(key)} style={inputStyle}>
                  {options.map((option) => (
                    <option key={option || "__empty"} value={option}>
                      {option ? option : "Maak een keuze"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ))}

      {(Object.keys(multiFieldLabels) as MultiField[]).map((group) => (
        <div key={group} style={sectionStyle}>
          <h2 style={sectionTitleStyle}>{multiFieldLabels[group]}</h2>
          <div style={gridStyle}>
            {derivedMultiOptions[group].map((option) => (
              <label key={option} style={checkboxRowStyle}>
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
      ))}
    </div>
  );
}
