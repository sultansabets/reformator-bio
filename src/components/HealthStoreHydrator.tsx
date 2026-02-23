/**
 * Hydrates health store from localStorage when user is available.
 * Place in layout so store is always in sync.
 */

import { useEffect } from "react";
import { useHealthStore } from "@/store/healthStore";
import { useAuth } from "@/contexts/AuthContext";

export function HealthStoreHydrator() {
  const { user } = useAuth();
  const hydrate = useHealthStore((s) => s.hydrate);

  useEffect(() => {
    if (!user?.id) return;
    hydrate(user.id, {
      weight: user.weight,
      height: user.height,
      age: user.dob ? new Date().getFullYear() - new Date(user.dob).getFullYear() : undefined,
      activityLevel: user.activityLevel,
    });
  }, [user?.id, user?.weight, user?.height, user?.dob, user?.activityLevel, hydrate]);

  return null;
}
