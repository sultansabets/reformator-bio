import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const FLOW_KEYS: Record<string, string> = {
  "connect-watch": "connectWatch",
  "apple-health": "appleHealth",
  "google-fit": "googleFit",
  "manual-entry": "manualEntry",
};

const OnboardingFlowPlaceholder = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { flow } = useParams<{ flow: string }>();
  const key = flow && FLOW_KEYS[flow] ? FLOW_KEYS[flow] : "connectWatch";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <p className="text-center font-medium text-foreground">
        {t(`onboarding.${key}`)}
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {t("onboarding.comingSoon")}
      </p>
      <Button
        variant="outline"
        className="mt-6 gap-2"
        onClick={() => navigate("/onboarding/data-source")}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>
    </div>
  );
};

export default OnboardingFlowPlaceholder;
