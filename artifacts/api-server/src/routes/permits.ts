import { Router, type IRouter } from "express";
import {
  GetRecentPermitsQueryParams,
  SearchPermitsQueryParams,
  GetLargePermitsQueryParams,
} from "@workspace/api-zod";
import {
  ensureDataLoaded,
  getCacheState,
  listBoroughs,
  getStats,
  getRecentPermits,
  searchPermits,
  getLargePermits,
  serializePermit,
} from "../lib/permits";

const router: IRouter = Router();

router.get("/permits/data-status", async (_req, res): Promise<void> => {
  const s = getCacheState();
  res.json({
    loaded: s.loaded,
    total_rows: s.total_rows,
    fetched_at: s.fetched_at?.toISOString() ?? null,
  });
});

router.get("/permits/boroughs", async (_req, res): Promise<void> => {
  ensureDataLoaded();
  const boroughs = listBoroughs();
  res.json({ boroughs, total: boroughs.length });
});

router.get("/permits/stats", async (_req, res): Promise<void> => {
  ensureDataLoaded();
  const stats = getStats();
  res.json(stats);
});

router.get("/permits/recent", async (req, res): Promise<void> => {
  ensureDataLoaded();
  const parsed = GetRecentPermitsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { borough, days = 7, limit = 50 } = parsed.data;
  const { permits, total } = getRecentPermits(borough, days, limit);
  res.json({ permits: permits.map(serializePermit), total, returned: permits.length });
});

router.get("/permits/search", async (req, res): Promise<void> => {
  ensureDataLoaded();
  const parsed = SearchPermitsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q, borough, limit = 50 } = parsed.data;
  if (!q || q.trim().length < 2) {
    res.status(400).json({ error: "Query must be at least 2 characters" });
    return;
  }
  const { permits, total } = searchPermits(q, borough, limit);
  res.json({ permits: permits.map(serializePermit), total, returned: permits.length });
});

router.get("/permits/large", async (req, res): Promise<void> => {
  ensureDataLoaded();
  const parsed = GetLargePermitsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { min_units = 5, borough, limit = 50 } = parsed.data;
  const { permits, total } = getLargePermits(min_units, borough, limit);
  res.json({ permits: permits.map(serializePermit), total, returned: permits.length });
});

export default router;
