import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const DATA_SOURCES = [
  { id: "watch", key: "connectWatch", path: "/onboarding/connect-watch" },
  { id: "apple-health", key: "appleHealth", path: "/onboarding/apple-health" },
  { id: "google-fit", key: "googleFit", path: "/onboarding/google-fit" },
  { id: "manual", key: "manualEntry", path: "/onboarding/manual-entry" },
] as const;

const DataSourceSelect = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 pt-12 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-xl font-semibold text-foreground">
          {t("onboarding.connectDevice")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("onboarding.selectSource")}
        </p>
      </motion.div>

      <div className="flex flex-1 flex-col gap-3">
        {DATA_SOURCES.map((source) => (
          <div key={source.id}>
            <Card
              className="cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => navigate(source.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <p className="font-medium text-foreground">
                  {t(`onboarding.${source.key}`)}
                </p>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardHeader>
            </Card>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        className="mt-6 w-full text-muted-foreground"
        onClick={() => navigate("/control")}
      >
        {t("common.back")}
      </Button>
    </div>
  );
};

export default DataSourceSelect;
