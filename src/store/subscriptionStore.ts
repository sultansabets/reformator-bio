import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SubscriptionPlan = "free" | "pro" | "pro_plus";

interface SubscriptionState {
  plan: SubscriptionPlan;
  expiresAt: number | null;
  setPlan: (plan: SubscriptionPlan) => void;
  setExpiry: (timestamp: number | null) => void;
  isProOrHigher: () => boolean;
  isPremium: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      plan: "free",
      expiresAt: null,
      setPlan: (plan) => set({ plan }),
      setExpiry: (timestamp) => set({ expiresAt: timestamp }),
      isProOrHigher: () => {
        const { plan, expiresAt } = get();
        if (plan === "free") return false;
        if (expiresAt && Date.now() > expiresAt) return false;
        return true;
      },
      isPremium: () => {
        const { plan, expiresAt } = get();
        if (plan !== "pro_plus") return false;
        if (expiresAt && Date.now() > expiresAt) return false;
        return true;
      },
    }),
    {
      name: "reformator-subscription",
    }
  )
);
