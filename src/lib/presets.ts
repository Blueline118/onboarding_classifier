import { supabase } from "./supabaseClient";

export type PresetPayload = {
  inputs: any;
  gw: any;
  vw: any;
  th: any;
  label?: string;
};
export type PresetRecord = {
  id?: string;
  name: string;
  data: PresetPayload;
  created_at?: string;
};

const LS_KEY = "onbClassifierPresets_v101";

/** Load presets (Supabase or localStorage). Filters incomplete payloads. */
export async function loadPresets(): Promise<PresetRecord[]> {
  if (!supabase) {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PresetRecord[]) : [];
  }
  const { data, error } = await supabase
    .from("classifier_presets")
    .select("id,name,data,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[presets] load", error);
    return [];
  }

  const rows = (data ?? []) as any[];
  return rows.filter(
    (r) => r?.data?.inputs && r?.data?.gw && r?.data?.vw && r?.data?.th,
  ) as any;
}

/** Create new preset */
export async function savePreset(name: string, payload: PresetPayload) {
  const safeName = name?.trim() || `Preset ${new Date().toLocaleString()}`;
  if (!supabase) {
    const list = await loadPresets();
    const rec: PresetRecord = {
      name: safeName,
      data: payload,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify([rec, ...list]));
    return;
  }
  const { error } = await supabase
    .from("classifier_presets")
    .insert({ name: safeName, data: payload });
  if (error) {
    console.error("[presets] save", error);
    throw error;
  }
}

/** Delete by id or name (accurate via select('id')) */
export async function deletePreset(idOrName: string) {
  if (!supabase) {
    const list = await loadPresets();
    const next = list.filter((p) => (p.id ?? p.name) !== idOrName);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    return { ok: true, count: list.length - next.length };
  }
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrName,
    );
  const base = supabase.from("classifier_presets").delete();
  const q = isUUID ? base.eq("id", idOrName) : base.eq("name", idOrName);
  const { error, data } = await q.select("id");
  if (error) {
    console.error("[presets] delete", error);
    throw error;
  }
  return { ok: true, count: Array.isArray(data) ? data.length : 0 };
}

/** Update-in-place by id or name */
export async function updatePreset(
  idOrName: string,
  name: string,
  payload: PresetPayload,
) {
  if (!supabase) {
    const list = await loadPresets();
    const idx = list.findIndex((p) => (p.id ?? p.name) === idOrName);
    if (idx === -1) return { ok: false, count: 0 };
    const updated: PresetRecord = {
      ...(list[idx] as any),
      name,
      data: payload,
      created_at: new Date().toISOString(),
    };
    const next = [...list];
    next[idx] = updated;
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    return { ok: true, count: 1, id: updated.id ?? updated.name };
  }
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrName,
    );
  const base = supabase
    .from("classifier_presets")
    .update({ name, data: payload });
  const q = isUUID ? base.eq("id", idOrName) : base.eq("name", idOrName);
  const { error, data } = await q.select("id");
  if (error) throw error;
  return {
    ok: true,
    count: Array.isArray(data) ? data.length : 0,
    id: isUUID ? idOrName : (Array.isArray(data) && data[0]?.id) || undefined,
  };
}
