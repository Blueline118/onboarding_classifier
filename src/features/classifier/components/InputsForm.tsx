import type { CSSProperties, FC } from "react";
import type { ClassifierInput, MultiOptions } from "../types";

interface InputsFormProps {
  value: ClassifierInput;
  onChange: (patch: Partial<ClassifierInput>) => void;
}

const section: CSSProperties = { marginBottom: 24 };
const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};
const label: CSSProperties = {
  fontSize: 13,
  color: "#374151",
  marginBottom: 6,
  display: "block",
};
const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
};
const grid3: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 16,
};
const h2: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  margin: "0 0 8px",
};

const dropdown = (opts: string[]) => opts.map((o) => ({ label: o, value: o }));

const DD = {
  skuComplexity: dropdown(["standaard", "varianten", "bundels"]),
  seizoensinvloed: dropdown(["laag", "medium", "hoog"]),
  platformType: dropdown([
    "Shopify",
    "Magento",
    "WooCommerce",
    "Lightspeed",
    "Bol.com",
    "API",
  ]),
  typeKoppeling: dropdown(["API", "SFTP", "plugin", "handmatig"]),
  configDoor: dropdown(["klant", "postnl", "hybride"]),
  mateMaatwerk: dropdown(["geen", "licht", "zwaar"]),
  mappingComplexiteit: dropdown(["standaard", "custom", "dynamisch"]),
  testCapaciteit: dropdown(["laag", "gemiddeld", "hoog"]),
  voorraadBeheer: dropdown(["realtime", "batch", "handmatig"]),
  replenishment: dropdown(["geautomatiseerd", "periodiek", "handmatig"]),
  verzendMethoden: dropdown(["standaard", "maatwerk", "externe"]),
  retourProces: dropdown(["portaal", "handmatig"]),
  dashboardGebruik: dropdown(["dagelijks", "wekelijks", "zelden"]),
  rapportageBehoefte: dropdown(["standaard", "uitgebreid", "maatwerk"]),
  serviceUitbreiding: dropdown(["nee", "ja"]),
  scopeWijzigingen: dropdown(["weinig", "gemiddeld", "veel"]),
};

type MultiField =
  | "vasActiviteiten"
  | "inboundBijzonderheden"
  | "postnlApis";

const InputsForm: FC<InputsFormProps> = ({ value, onChange }) => {
  const handleMultiChange = (
    field: MultiField,
    option: string,
    checked: boolean,
  ) => {
    const current = value[field];
    onChange({
      [field]: {
        ...(current as MultiOptions),
        [option]: checked,
      },
    } as Partial<ClassifierInput>);
  };

  return (
    <>
      <div style={{ ...card, ...section }}>
        <h2 style={h2}>Basiskenmerken</h2>
        <div style={grid3}>
          <div>
            <label style={label}>Aantal SKU’s</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={100000}
              value={value.skuCount}
              onChange={(event) =>
                onChange({ skuCount: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label style={label}>Ordervolume / maand</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={10000000}
              value={value.orderVolume}
              onChange={(event) =>
                onChange({ orderVolume: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label style={label}>Orderpiek / maand</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={10000000}
              value={value.orderPeak}
              onChange={(event) =>
                onChange({ orderPeak: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label style={label}>Retourpercentage %</label>
            <input
              style={inputStyle}
              type="number"
              min={0}
              max={100}
              value={value.retourPercentage}
              onChange={(event) =>
                onChange({ retourPercentage: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label style={label}>Aantal afdelingen (klantzijde)</label>
            <input
              style={inputStyle}
              type="number"
              min={1}
              max={10}
              value={value.aantalAfdelingen}
              onChange={(event) =>
                onChange({ aantalAfdelingen: Number(event.target.value) })
              }
            />
          </div>
          <div>
            <label style={label}>SKU-complexiteit</label>
            <select
              style={inputStyle}
              value={value.skuComplexity}
              onChange={(event) =>
                onChange({ skuComplexity: event.target.value })
              }
            >
              {DD.skuComplexity.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Seizoensinvloed</label>
            <select
              style={inputStyle}
              value={value.seizoensinvloed}
              onChange={(event) =>
                onChange({ seizoensinvloed: event.target.value })
              }
            >
              {DD.seizoensinvloed.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Platformtype</label>
            <select
              style={inputStyle}
              value={value.platformType}
              onChange={(event) =>
                onChange({ platformType: event.target.value })
              }
            >
              {DD.platformType.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Type koppeling</label>
            <select
              style={inputStyle}
              value={value.typeKoppeling}
              onChange={(event) =>
                onChange({ typeKoppeling: event.target.value })
              }
            >
              {DD.typeKoppeling.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Configuratie door</label>
            <select
              style={inputStyle}
              value={value.configDoor}
              onChange={(event) =>
                onChange({ configDoor: event.target.value })
              }
            >
              {DD.configDoor.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Mate van maatwerk</label>
            <select
              style={inputStyle}
              value={value.mateMaatwerk}
              onChange={(event) =>
                onChange({ mateMaatwerk: event.target.value })
              }
            >
              {DD.mateMaatwerk.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Mapping-complexiteit</label>
            <select
              style={inputStyle}
              value={value.mappingComplexiteit}
              onChange={(event) =>
                onChange({ mappingComplexiteit: event.target.value })
              }
            >
              {DD.mappingComplexiteit.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Testcapaciteit (klant)</label>
            <select
              style={inputStyle}
              value={value.testCapaciteit}
              onChange={(event) =>
                onChange({ testCapaciteit: event.target.value })
              }
            >
              {DD.testCapaciteit.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Voorraadbeheer</label>
            <select
              style={inputStyle}
              value={value.voorraadBeheer}
              onChange={(event) =>
                onChange({ voorraadBeheer: event.target.value })
              }
            >
              {DD.voorraadBeheer.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Replenishment</label>
            <select
              style={inputStyle}
              value={value.replenishment}
              onChange={(event) =>
                onChange({ replenishment: event.target.value })
              }
            >
              {DD.replenishment.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Verzendmethoden</label>
            <select
              style={inputStyle}
              value={value.verzendMethoden}
              onChange={(event) =>
                onChange({ verzendMethoden: event.target.value })
              }
            >
              {DD.verzendMethoden.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Retourproces</label>
            <select
              style={inputStyle}
              value={value.retourProces}
              onChange={(event) =>
                onChange({ retourProces: event.target.value })
              }
            >
              {DD.retourProces.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Dashboardgebruik</label>
            <select
              style={inputStyle}
              value={value.dashboardGebruik}
              onChange={(event) =>
                onChange({ dashboardGebruik: event.target.value })
              }
            >
              {DD.dashboardGebruik.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Rapportagebehoefte</label>
            <select
              style={inputStyle}
              value={value.rapportageBehoefte}
              onChange={(event) =>
                onChange({ rapportageBehoefte: event.target.value })
              }
            >
              {DD.rapportageBehoefte.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Service-uitbreiding</label>
            <select
              style={inputStyle}
              value={value.serviceUitbreiding}
              onChange={(event) =>
                onChange({ serviceUitbreiding: event.target.value })
              }
            >
              {DD.serviceUitbreiding.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>Scope wijzigingen</label>
            <select
              style={inputStyle}
              value={value.scopeWijzigingen}
              onChange={(event) =>
                onChange({ scopeWijzigingen: event.target.value })
              }
            >
              {DD.scopeWijzigingen.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ ...card, ...section }}>
        <h2 style={h2}>Variabele selectie</h2>
        <div style={grid3}>
          {Object.entries(value.vasActiviteiten).map(([name, active]) => (
            <label key={name} style={{ ...label, display: "flex", gap: 8 }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(event) =>
                  handleMultiChange("vasActiviteiten", name, event.target.checked)
                }
              />
              {name}
            </label>
          ))}
        </div>
      </div>
    </>
  );
};

export default InputsForm;
