"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONDITION_TYPES = [
  "cavity",
  "filling",
  "crown",
  "root_canal",
  "extraction",
  "implant",
  "bridge",
  "fracture",
  "impacted",
  "missing",
  "healthy",
  "other",
];

const SURFACES = ["mesial", "distal", "occlusal", "lingual", "buccal"];

const TREATMENT_STATUS = ["planned", "in_progress", "completed"];

const PRIORITY_LEVELS = ["low", "medium", "high"];

export interface ToothData {
  toothNumber: string;
  conditionType?: string;
  treatmentStatus?: string;
  priority?: string;
  estimatedCost?: number;
  notes?: string;
  surfaces?: string[];
}

interface ToothConditionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothNumber: string;
  initialData?: ToothData;
  onSave: (data: ToothData) => Promise<void>;
}

export function ToothConditionModal({
  open,
  onOpenChange,
  toothNumber,
  initialData,
  onSave,
}: ToothConditionModalProps) {
  const [conditionType, setConditionType] = useState(
    initialData?.conditionType || ""
  );
  const [treatmentStatus, setTreatmentStatus] = useState(
    initialData?.treatmentStatus || "planned"
  );
  const [priority, setPriority] = useState(initialData?.priority || "medium");
  const [estimatedCost, setEstimatedCost] = useState(
    initialData?.estimatedCost?.toString() || ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>(
    initialData?.surfaces || []
  );
  const [loading, setLoading] = useState(false);

  const toggleSurface = (surface: string) => {
    setSelectedSurfaces((prev) =>
      prev.includes(surface)
        ? prev.filter((s) => s !== surface)
        : [...prev, surface]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave({
        toothNumber,
        conditionType,
        treatmentStatus,
        priority,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        notes,
        surfaces: selectedSurfaces,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chart Tooth #{toothNumber}</DialogTitle>
          <DialogDescription>
            Record tooth condition, treatment plan, and clinical notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Condition Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Condition Type *
            </label>
            <Select value={conditionType} onValueChange={setConditionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select tooth condition" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace("_", " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Surface Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Affected Surfaces
            </label>
            <div className="flex flex-wrap gap-2">
              {SURFACES.map((surface) => (
                <button
                  key={surface}
                  type="button"
                  onClick={() => toggleSurface(surface)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                    selectedSurfaces.includes(surface)
                      ? "bg-sky-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {surface.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Treatment Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Treatment Status
              </label>
              <Select value={treatmentStatus} onValueChange={setTreatmentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TREATMENT_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Estimated Cost (₱)
            </label>
            <input
              type="number"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="0.00"
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Clinical Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Clinical Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record any clinical observations or treatment notes..."
              className="min-h-24 resize-none"
            />
          </div>

          {/* Summary Card */}
          <Card className="bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold text-slate-600">
              SUMMARY
            </p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-slate-700">Tooth:</span>{" "}
                <span className="text-slate-600">#{toothNumber}</span>
              </p>
              {conditionType && (
                <p>
                  <span className="font-medium text-slate-700">Condition:</span>{" "}
                  <span className="text-slate-600">
                    {conditionType.replace("_", " ")}
                  </span>
                </p>
              )}
              {selectedSurfaces.length > 0 && (
                <p>
                  <span className="font-medium text-slate-700">Surfaces:</span>{" "}
                  <span className="text-slate-600">
                    {selectedSurfaces.map((s) => s.toUpperCase()).join(", ")}
                  </span>
                </p>
              )}
            </div>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !conditionType}
          >
            {loading ? "Saving..." : "Save Tooth Condition"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
