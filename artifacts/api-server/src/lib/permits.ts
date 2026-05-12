import { parse } from "csv-parse";
import { logger } from "./logger";

const CSV_URL =
  "https://donnees.montreal.ca/dataset/d90eaf1b-2de8-43f0-923a-27a620ecdf41" +
  "/resource/5232a72d-235a-48eb-ae20-bb9d501300ad/download/permis-construction.csv";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; MontrealPermitExplorer/1.0; +https://donnees.montreal.ca)",
};

export interface PermitRow {
  id: string;
  address: string;
  borough: string;
  work_type: string;
  work_detail: string;
  building_type: string;
  units: number | null;
  date_issued: Date | null;
  date_started: Date | null;
  longitude: number | null;
  latitude: number | null;
}

interface CacheState {
  rows: PermitRow[];
  loaded: boolean;
  total_rows: number | null;
  fetched_at: Date | null;
  loading: boolean;
}

const state: CacheState = {
  rows: [],
  loaded: false,
  total_rows: null,
  fetched_at: null,
  loading: false,
};

function parseDate(s: string | undefined): Date | null {
  if (!s || !s.trim()) return null;
  const d = new Date(s.trim());
  return isNaN(d.getTime()) ? null : d;
}

function parseFloat_(s: string | undefined): number | null {
  if (!s || !s.trim()) return null;
  const n = parseFloat(s.trim());
  return isNaN(n) ? null : n;
}

function parseInt_(s: string | undefined): number | null {
  if (!s || !s.trim()) return null;
  const n = parseInt(s.trim(), 10);
  return isNaN(n) ? null : n;
}

function mapRow(r: Record<string, string>): PermitRow {
  return {
    id: String(r["no_demande"] ?? r["id_permis"] ?? ""),
    address: (r["emplacement"] ?? "").trim(),
    borough: (r["arrondissement"] ?? "").trim(),
    work_type: (r["description_type_demande"] ?? "").trim(),
    work_detail: (r["nature_travaux"] ?? "").trim(),
    building_type: (r["description_type_batiment"] ?? "").trim(),
    units: parseInt_(r["nb_logements"]),
    date_issued: parseDate(r["date_emission"]),
    date_started: parseDate(r["date_debut"]),
    longitude: parseFloat_(r["longitude"]),
    latitude: parseFloat_(r["latitude"]),
  };
}

export function getCacheState(): Pick<
  CacheState,
  "loaded" | "total_rows" | "fetched_at"
> {
  return {
    loaded: state.loaded,
    total_rows: state.total_rows,
    fetched_at: state.fetched_at,
  };
}

export function ensureDataLoaded(): void {
  if (state.loaded || state.loading) return;
  state.loading = true;
  void loadData();
}

async function loadData(): Promise<void> {
  logger.info("Downloading Montreal permit CSV…");
  try {
    const res = await fetch(CSV_URL, { headers: HEADERS });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const text = await res.text();
    const rows = await new Promise<PermitRow[]>((resolve, reject) => {
      parse(
        text,
        { columns: true, skip_empty_lines: true, trim: true },
        (err, records: Record<string, string>[]) => {
          if (err) return reject(err);
          resolve(records.map(mapRow));
        },
      );
    });
    state.rows = rows;
    state.loaded = true;
    state.total_rows = rows.length;
    state.fetched_at = new Date();
    state.loading = false;
    logger.info({ count: rows.length }, "Permit data loaded");
  } catch (err) {
    state.loading = false;
    logger.error({ err }, "Failed to load permit data");
  }
}

export function getRows(): PermitRow[] {
  return state.rows;
}

export function listBoroughs(): string[] {
  const seen = new Set<string>();
  for (const r of state.rows) {
    if (r.borough) seen.add(r.borough);
  }
  return [...seen].sort();
}

export function getStats() {
  const now = Date.now();
  const ms7 = 7 * 86400000;
  const ms30 = 30 * 86400000;
  const ms365 = 365 * 86400000;

  let last7 = 0;
  let last30 = 0;
  let last365 = 0;
  const boroughCounts: Record<string, number> = {};
  const workTypeCounts: Record<string, number> = {};

  for (const r of state.rows) {
    const ts = r.date_issued?.getTime() ?? 0;
    const age = now - ts;
    if (age <= ms7) last7++;
    if (age <= ms30) last30++;
    if (age <= ms365) last365++;
    if (r.borough) boroughCounts[r.borough] = (boroughCounts[r.borough] ?? 0) + 1;
    if (r.work_type) workTypeCounts[r.work_type] = (workTypeCounts[r.work_type] ?? 0) + 1;
  }

  const byBorough = Object.entries(boroughCounts)
    .map(([borough, count]) => ({ borough, count }))
    .sort((a, b) => b.count - a.count);

  const topWorkTypes = Object.entries(workTypeCounts)
    .map(([borough, count]) => ({ borough, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_permits: state.rows.length,
    last_7_days: last7,
    last_30_days: last30,
    last_365_days: last365,
    by_borough: byBorough,
    top_work_types: topWorkTypes,
  };
}

export function getRecentPermits(
  borough: string,
  days: number,
  limit: number,
): { permits: PermitRow[]; total: number } {
  const cutoff = Date.now() - days * 86400000;
  const lowerBorough = borough.toLowerCase();

  const filtered = state.rows.filter(
    (r) =>
      r.borough.toLowerCase().includes(lowerBorough) &&
      (r.date_issued?.getTime() ?? 0) >= cutoff,
  );
  filtered.sort(
    (a, b) => (b.date_issued?.getTime() ?? 0) - (a.date_issued?.getTime() ?? 0),
  );
  return { permits: filtered.slice(0, limit), total: filtered.length };
}

export function searchPermits(
  q: string,
  borough: string | undefined,
  limit: number,
): { permits: PermitRow[]; total: number } {
  const lower = q.toLowerCase();
  const lowerBorough = borough?.toLowerCase();

  const filtered = state.rows.filter((r) => {
    const matchBorough = lowerBorough
      ? r.borough.toLowerCase().includes(lowerBorough)
      : true;
    const matchQ =
      r.address.toLowerCase().includes(lower) ||
      r.work_detail.toLowerCase().includes(lower) ||
      r.work_type.toLowerCase().includes(lower) ||
      r.building_type.toLowerCase().includes(lower);
    return matchBorough && matchQ;
  });
  filtered.sort(
    (a, b) => (b.date_issued?.getTime() ?? 0) - (a.date_issued?.getTime() ?? 0),
  );
  return { permits: filtered.slice(0, limit), total: filtered.length };
}

export function getLargePermits(
  minUnits: number,
  borough: string | undefined,
  limit: number,
): { permits: PermitRow[]; total: number } {
  const lowerBorough = borough?.toLowerCase();

  const filtered = state.rows.filter((r) => {
    const matchBorough = lowerBorough
      ? r.borough.toLowerCase().includes(lowerBorough)
      : true;
    return matchBorough && (r.units ?? 0) >= minUnits;
  });
  filtered.sort((a, b) => (b.units ?? 0) - (a.units ?? 0));
  return { permits: filtered.slice(0, limit), total: filtered.length };
}

function serializePermit(r: PermitRow) {
  return {
    id: r.id,
    address: r.address,
    borough: r.borough,
    work_type: r.work_type,
    work_detail: r.work_detail,
    building_type: r.building_type,
    units: r.units,
    date_issued: r.date_issued?.toISOString().split("T")[0] ?? "",
    date_started: r.date_started?.toISOString().split("T")[0] ?? null,
    longitude: r.longitude,
    latitude: r.latitude,
  };
}

export { serializePermit };
