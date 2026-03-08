/**
 * React Query hooks for metrics API.
 * Fetches metrics and syncs to healthStore on success.
 */

import { useQuery } from "@tanstack/react-query";
import { getMetricsSummary, getMetricsRange } from "@/api/metricsApi";
import { useHealthStore, hasValidMetrics } from "@/store/healthStore";
import { getAccessToken } from "@/api/apiClient";
import { useEffect } from "react";

export const METRICS_QUERY_KEY = "metrics";

function getTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");
}

/**
 * Fetches metrics summary. Date optional — backend returns today if omitted.
 * Uses token for auth; userId not required (backend identifies user from token).
 */
export function useMetricsSummaryQuery(
  date: string | undefined,
  isAuthenticated: boolean
) {
  const setFromApiMetrics = useHealthStore((s) => s.setFromApiMetrics);
  const clearMetrics = useHealthStore((s) => s.clearMetrics);
  const token = getAccessToken();

  const query = useQuery({
    queryKey: [METRICS_QUERY_KEY, "summary", date ?? "today"],
    queryFn: () => getMetricsSummary(date),
    enabled: !!token && isAuthenticated,
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  useEffect(() => {
    if (query.data && hasValidMetrics(query.data)) {
      const viewDate = date ?? getTodayISO();
      setFromApiMetrics(query.data, viewDate);
    } else if (query.isSuccess && query.data !== undefined) {
      clearMetrics();
    }
  }, [query.data, query.isSuccess, date, setFromApiMetrics, clearMetrics]);

  return query;
}

/**
 * Fetches metrics range using startDate and endDate.
 * Uses token for auth; userId not required.
 */
export function useMetricsRangeQuery(
  startDate: string | undefined,
  endDate: string | undefined,
  isAuthenticated: boolean
) {
  const token = getAccessToken();

  return useQuery({
    queryKey: [METRICS_QUERY_KEY, "range", startDate, endDate],
    queryFn: () => getMetricsRange(startDate!, endDate!),
    enabled: !!startDate && !!endDate && !!token && isAuthenticated,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
