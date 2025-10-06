import { supabase } from "./supabaseClient";

export type PresetPayload = {
  inputs: any; gw: any; vw: any; th: any; label?: string;
};
export type PresetRecord = { id?: string; name: string; data: PresetPayload; created_at?: string };

const LS_KEY = "onbClassifierPresets_v101";

export async function loadPresets(): Promise<PresetRecord[]> {
  if (!supabase) {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PresetRecord[]) : [];
  }
  const { data, error } = await supabase
    .from("classifier_presets")
    .select("id,name,data,created_at")
    .order("created_at", { ascending: false });
  if (error) { console.error("[presets] load", error); return []; }

  // alleen presets met volledige payload
  const rows = (data ?? []) as any[];
  return rows.filter(r => r?.data?.inputs && r?.data?.gw && r?.data?.vw && r?.data?.th) as any;
}

export async function savePreset(name: string, payload: PresetPayload) {
  const safeName = name?.trim() || `Preset ${new Date().toLocaleString()}`;
  if (!supabase) {
    const list = await loadPresets();
    const rec: PresetRecord = { name: safeName, data: payload, created_at: new Date().toISOString() };
    localStorage.setItem(LS_KEY, JSON.stringify([rec, ...list]));
    return;
  }
  const { error } = await supabase.from("classifier_presets").insert({ name: safeName, data: payload });
  if (error) { console.error("[presets] save", error); throw error; }
}

export async function deletePreset(idOrName: string) {
  if (!supabase) {
    const list = await loadPresets();
    localStorage.setItem(LS_KEY, JSON.stringify(list.filter(p => (p.id ?? p.name) !== idOrName)));
    return;
  }
  const { error } = await supabase
    .from("classifier_presets")
    .delete()
    .or(`id.eq.${idOrName},name.eq.${idOrName}`);
  if (error) { console.error("[presets] delete", error); throw error; }
}
