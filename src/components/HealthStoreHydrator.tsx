/**
 * Hydrates health store from API (via React Query) or localStorage fallback.
 * Place in layout so store is always in sync.
 */

import { useEffect } from "react";
import { useHealthStore } from "@/store/healthStore";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user } = useAuth();
  const hydrate = useHealthStore((s) => s.hydrate);
  const today = getTodayISO();
  const metricsQuery = useMetricsSummaryQuery(today, user?.id);
  const hasToken = !!getAccessToken();

  useEffect(() => {
    if (!user?.id) return;
    if (hasToken && !metricsQuery.isError) return;
    hydrate(user.id, {
      weight: user.weight,
      height: user.height,
      age: user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : undefined,
      activityLevel: user.activityLevel,
    });
  }, [user?.id, user?.weight, user?.height, user?.dob, user?.activityLevel, hydrate, hasToken, metricsQuery.isError]);

  return null;
}
