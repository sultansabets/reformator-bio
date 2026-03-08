import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  startHealthSimulation,
  stopHealthSimulation,
  getIsSimulationRunning,
  getCurrentPhysiologicalState,
  getLatestMetrics,
  enableFastSimulation,
  disableFastSimulation,
} from "@/services/liveHealthSimulator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";

const ManualEntry = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fastMode, setFastMode] = useState(false);
  const [isRunning, setIsRunning] = useState(getIsSimulationRunning);
  const [state, setState] = useState(getCurrentPhysiologicalState);
  const [metrics, setMetrics] = useState(getLatestMetrics);

  useEffect(() => {
    const check = () => {
      setIsRunning(getIsSimulationRunning());
      setState(getCurrentPhysiologicalState());
      setMetrics(getLatestMetrics());
    };
    const id = setInterval(check, 500);
    return () => clearInterval(id);
  }, []);

  const handleStart = async () => {
    setError(null);
    setLoading(true);
    try {
      if (fastMode) enableFastSimulation();
      else disableFastSimulation();
      await startHealthSimulation(queryClient);
      setIsRunning(true);
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

  const handleStop = () => {
    stopHealthSimulation();
    setIsRunning(false);
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
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t("onboarding.normalSimulation")}
          </span>
          <Switch
            checked={fastMode}
            onCheckedChange={setFastMode}
            disabled={isRunning}
          />
          <span className="text-sm text-muted-foreground">
            {t("onboarding.fastSimulation")}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground">
          {isRunning
            ? t("onboarding.simulationRunning")
            : t("onboarding.simulationStopped")}
        </p>
        {isRunning && (
          <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              {t("onboarding.currentCircadianPhase")}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {t(`onboarding.phase${state}`)}
            </p>
            {metrics && (
              <p className="mt-3 text-sm text-muted-foreground">
                HR: {metrics.heartRate} bpm
                {metrics.hrv != null && ` · HRV: ${metrics.hrv} ms`}
                {" · "}
                {t("onboarding.steps")}: {metrics.steps}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={loading || isRunning}
          >
            {loading ? t("common.loading") : t("onboarding.startSimulation")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={handleStop}
            disabled={!isRunning}
          >
            {t("onboarding.stopSimulation")}
          </Button>
        </div>
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
