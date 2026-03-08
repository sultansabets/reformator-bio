import React from "react";
import { useTranslation } from "react-i18next";
import { getGreetingByTime } from "@/lib/greeting";
import type { Profile } from "@/api/profileApi";

export interface GreetingHeaderProps {
  profile?: Profile | null;
}

function getDisplayName(profile: Profile | null | undefined, fallback: string): string {
  const initials =
    [profile?.firstName, profile?.lastName]
      .filter(Boolean)
      .map((s) => (s as string)[0])
      .join("")
      .toUpperCase() || undefined;
  return (
    profile?.nickname?.trim() ??
    profile?.firstName?.trim() ??
    initials ??
    fallback
  );
}

export function GreetingHeader({ profile }: GreetingHeaderProps) {
  const { t } = useTranslation();
  const displayName = getDisplayName(profile, t("common.user"));

  return (
    <div className="mb-4 flex flex-col items-center text-center">
      <p className="text-sm text-muted-foreground">{getGreetingByTime()}</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">{displayName}</h1>
    </div>
  );
}
