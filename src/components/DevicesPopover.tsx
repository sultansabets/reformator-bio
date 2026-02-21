import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Watch, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface Device {
  id: string;
  name: string;
  icon: React.ElementType;
  connected: boolean;
  battery: number;
}

function getStatusColor(devices: Device[]): string {
  if (devices.length === 0) return "rgb(239, 68, 68)";
  const hasConnected = devices.some((d) => d.connected);
  if (!hasConnected) return "rgb(239, 68, 68)";
  const hasLowBattery = devices.some((d) => d.connected && d.battery < 20);
  if (hasLowBattery) return "rgb(234, 179, 8)";
  return "rgb(34, 197, 94)";
}

export function DevicesPopover() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const devices: Device[] = [
    {
      id: "apple",
      name: t("settings.appleWatch"),
      icon: Watch,
      connected: user?.wearable === "apple",
      battery: user?.wearable === "apple" ? 85 : 0,
    },
    {
      id: "reformator-band",
      name: t("settings.reformatorBand"),
      icon: Smartphone,
      connected: user?.wearable === "reformator-band",
      battery: user?.wearable === "reformator-band" ? 72 : 0,
    },
  ];

  const statusColor = getStatusColor(devices);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleDeviceClick = (deviceId: string) => {
    setOpen(false);
    navigate("/profile");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
        aria-label={t("settings.devices")}
      >
        <div className="relative">
          <Watch className="h-5 w-5" />
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background"
            style={{ backgroundColor: statusColor }}
          />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full z-50 mt-2 w-64 origin-top-left rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur-xl"
          >
            <p className="mb-2 px-2 pt-1 text-xs font-medium text-muted-foreground">
              {t("settings.devices")}
            </p>
            <div className="space-y-1">
              {devices.map((device) => {
                const Icon = device.icon;
                const batteryColor = device.battery < 20 ? "text-red-500" : "text-foreground";
                const statusText = device.connected
                  ? t("settings.connected")
                  : t("settings.notConnected");
                const statusTextColor = device.connected
                  ? "text-green-500"
                  : "text-muted-foreground";

                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => handleDeviceClick(device.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{device.name}</p>
                      <p className={`text-xs ${statusTextColor}`}>{statusText}</p>
                    </div>
                    {device.connected && (
                      <span className={`text-xs font-semibold tabular-nums ${batteryColor}`}>
                        {device.battery}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
