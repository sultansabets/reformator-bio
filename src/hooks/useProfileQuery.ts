/**
 * React Query hook for profile API.
 */

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/api/profileApi";
import { getAccessToken } from "@/api/apiClient";

export const PROFILE_QUERY_KEY = "profile";

export function useProfileQuery() {
  const hasToken = !!getAccessToken();

  return useQuery({
    queryKey: [PROFILE_QUERY_KEY],
    queryFn: getProfile,
    enabled: hasToken,
    staleTime: 0,
    refetchOnMount: true,
  });
}
