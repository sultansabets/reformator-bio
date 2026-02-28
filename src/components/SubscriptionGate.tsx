import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SubscriptionGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionGateModal({ open, onOpenChange }: SubscriptionGateModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/subscription");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] border border-border bg-card p-6 text-center">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Доступ к ИИ
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Доступ к ИИ доступен только в Pro AI
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          <Button className="w-full" onClick={handleUpgrade}>
            Улучшить план
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
