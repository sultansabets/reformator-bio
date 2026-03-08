/**
 * Syncs health store from API via React Query.
 * Place in layout so store is always in sync.
 * Metrics come only from GET /metrics/summary — no localStorage fallback.
 */

import { useMetricsSummaryQuery } from "@/hooks/useMetricsQuery";
import { getAccessToken } from "@/api/apiClient";

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

export function HealthStoreHydrator() {
  const today = getTodayISO();
  const hasToken = !!getAccessToken();
  useMetricsSummaryQuery(today, !!hasToken);
  return null;
}
