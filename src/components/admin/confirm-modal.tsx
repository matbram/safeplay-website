"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ConfirmModalVariant = "danger" | "warning" | "info" | "success";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  variant?: ConfirmModalVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  requireConfirmation?: string; // Text user must type to confirm
  loading?: boolean;
  children?: React.ReactNode; // Additional content
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconClass: "text-error",
    bgClass: "bg-error/10",
    buttonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-warning",
    bgClass: "bg-warning/10",
    buttonVariant: "default" as const,
  },
  info: {
    icon: Info,
    iconClass: "text-secondary",
    bgClass: "bg-secondary/10",
    buttonVariant: "default" as const,
  },
  success: {
    icon: CheckCircle,
    iconClass: "text-success",
    bgClass: "bg-success/10",
    buttonVariant: "default" as const,
  },
};

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  variant = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  requireConfirmation,
  loading = false,
  children,
}: ConfirmModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const config = variantConfig[variant];
  const Icon = config.icon;

  const canConfirm = !requireConfirmation || confirmInput === requireConfirmation;
  const showLoading = loading || isLoading;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
      setConfirmInput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!showLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setConfirmInput("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                config.bgClass
              )}
            >
              <Icon className={cn("w-6 h-6", config.iconClass)} />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {(requireConfirmation || children) && (
          <div className="space-y-4 py-4">
            {children}
            {requireConfirmation && (
              <div className="space-y-2">
                <Label>
                  Type <span className="font-mono font-bold">{requireConfirmation}</span>{" "}
                  to confirm
                </Label>
                <Input
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={requireConfirmation}
                  disabled={showLoading}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={showLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={!canConfirm || showLoading}
          >
            {showLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
