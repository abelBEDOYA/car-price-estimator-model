/** Ruta relativa: Next (o `next dev`) reescribe `/backend/*` hacia FastAPI (véase `next.config.mjs`). */
const defaultBrowserBase = "/backend";

declare global {
  interface Window {
    /** Override en cliente sin rebuild. */
    __RYC_API_BASE__?: string;
  }
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/$/, "");
}

/**
 * Base de la API (sin barra final).
 *
 * Por defecto en el navegador: `/backend` → mismo origen que la web; el servidor Next hace de proxy
 * (igual que `baseURL: '/backend'` + Vite proxy en olympic-rowing-dynamics-analysis).
 *
 * Opcional: `NEXT_PUBLIC_API_URL` para saltarse el proxy y llamar a otra URL absoluta.
 * En SSR (raro aquí): `BACKEND_INTERNAL_URL` o `http://127.0.0.1:8000`.
 */
export function getApiBase(): string {
  const fromWindow =
    typeof window !== "undefined" && typeof window.__RYC_API_BASE__ === "string"
      ? window.__RYC_API_BASE__.trim()
      : "";
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (fromWindow) return stripTrailingSlash(fromWindow);
  if (fromEnv) return stripTrailingSlash(fromEnv);
  if (typeof window !== "undefined") return defaultBrowserBase;
  const internal = (process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000").trim();
  return stripTrailingSlash(internal);
}

async function readJsonError(r: Response): Promise<string> {
  const text = await r.text();
  try {
    const j = JSON.parse(text) as { detail?: unknown; error?: string };
    if (j.detail !== undefined) {
      return typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail);
    }
    if (j.error) return j.error;
  } catch {
    /* ignore */
  }
  return text.slice(0, 200) || r.statusText;
}

export type Meta = {
  makes: string[];
  models: string[];
  models_by_make: Record<string, string[]>;
  fuels: string[];
  shifts: string[];
};

export type CarParams = {
  marca: string;
  model: string;
  fuel: string;
  shift: string;
  kms: number;
  year: number;
  power: number;
  publishDate: number;
};

/** Modelos del JSON por marca que además existen en el vocabulario del modelo ML. */
export function modelsForMake(meta: Meta, marca: string): string[] {
  const raw = meta.models_by_make?.[marca];
  if (!raw?.length) return [];
  const allowed = new Set(meta.models);
  return raw.filter((m) => allowed.has(m)).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
}

function qs(p: CarParams): string {
  const u = new URLSearchParams();
  u.set("marca", p.marca);
  u.set("model", p.model);
  u.set("fuel", p.fuel);
  u.set("shift", p.shift);
  u.set("kms", String(p.kms));
  u.set("year", String(p.year));
  u.set("power", String(p.power));
  u.set("date", String(p.publishDate));
  return u.toString();
}

export async function fetchMeta(): Promise<Meta> {
  const r = await fetch(`${getApiBase()}/meta`, { cache: "no-store" });
  if (!r.ok) throw new Error(`meta (${r.status}): ${await readJsonError(r)}`);
  return r.json();
}

export type PriceResponse = { price: number | null; error?: string };

export async function fetchPrice(p: CarParams): Promise<PriceResponse> {
  const r = await fetch(`${getApiBase()}/car_features?${qs(p)}`);
  if (!r.ok) throw new Error(`car_features (${r.status}): ${await readJsonError(r)}`);
  return r.json();
}

export async function fetchAnalysis(p: CarParams): Promise<Record<string, unknown>> {
  const r = await fetch(`${getApiBase()}/car_analysis?${qs(p)}`);
  if (!r.ok) throw new Error(`car_analysis (${r.status}): ${await readJsonError(r)}`);
  return r.json();
}
