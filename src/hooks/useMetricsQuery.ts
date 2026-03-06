/**
 * React Query hooks for metrics API.
 * Fetches metrics and syncs to healthStore on success.
 */

import { useQuery } from "@tanstack/react-query";
import { getMetricsSummary, getMetricsRange } from "@/api/metricsApi";
import { useHealthStore } from "@/store/healthStore";
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
 */
export function useMetricsSummaryQuery(
  date: string | undefined,
  userId: string | undefined
) {
  const setFromApiMetrics = useHealthStore((s) => s.setFromApiMetrics);
  const hasToken = !!getAccessToken();

  const query = useQuery({
    queryKey: [METRICS_QUERY_KEY, "summary", date ?? "today"],
    queryFn: () => getMetricsSummary(date),
    enabled: !!userId && hasToken,
    staleTime: 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      const viewDate = date ?? getTodayISO();
      setFromApiMetrics(query.data, viewDate);
    }
  }, [query.isSuccess, query.data, date, setFromApiMetrics]);

  return query;
}

/**
 * Fetches metrics range using startDate and endDate.
 */
export function useMetricsRangeQuery(
  startDate: string | undefined,
  endDate: string | undefined,
  userId: string | undefined
) {
  const hasToken = !!getAccessToken();

  return useQuery({
    queryKey: [METRICS_QUERY_KEY, "range", startDate, endDate],
    queryFn: () => getMetricsRange(startDate!, endDate!),
    enabled: !!startDate && !!endDate && !!userId && hasToken,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
