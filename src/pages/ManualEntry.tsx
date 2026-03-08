import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { getOrRegisterSimulatorDevice, syncDevice } from "@/api/deviceApi";
import { METRICS_QUERY_KEY } from "@/hooks/useMetricsQuery";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ManualEntry = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateTestData = async () => {
    setError(null);
    setLoading(true);
    try {
      const deviceId = await getOrRegisterSimulatorDevice();
      const now = new Date().toISOString();
      await syncDevice({
        deviceId,
        heartRates: [{ valueBpm: 72, recordedAt: now }],
        hrv: [{ valueMs: 55, recordedAt: now }],
        steps: [{ count: 4200, recordedAt: now }],
      });
      await queryClient.invalidateQueries({ queryKey: [METRICS_QUERY_KEY] });
      navigate("/control", { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t("errors.requestFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-5 pt-12 pb-8">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          {t("onboarding.simulateHealthData")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("onboarding.simulateHealthDataHint")}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <Button
          size="lg"
          onClick={handleGenerateTestData}
          disabled={loading}
        >
          {loading ? t("common.loading") : t("onboarding.generateTestData")}
        </Button>
        {error && (
          <p className="text-center text-sm text-destructive">{error}</p>
        )}
      </div>

      <Button
        variant="ghost"
        className="mt-6 w-full gap-2 text-muted-foreground"
        onClick={() => navigate("/onboarding/data-source")}
        disabled={loading}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </Button>
    </div>
  );
};

export default ManualEntry;
