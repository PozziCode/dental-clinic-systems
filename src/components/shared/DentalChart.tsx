"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

const teeth = [
  "18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28",
  "48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38",
];

const conditionColors: Record<string, string> = {
  cavity: "bg-red-500",
  filling: "bg-blue-500",
  crown: "bg-yellow-500",
  root_canal: "bg-purple-500",
  extraction: "bg-gray-600",
  implant: "bg-green-500",
  bridge: "bg-indigo-500",
  fracture: "bg-orange-500",
  impacted: "bg-pink-500",
  missing: "bg-slate-400",
  healthy: "bg-slate-100 border-green-500",
  other: "bg-slate-300",
};

export interface ToothCondition {
  toothNumber: string;
  type: keyof typeof conditionColors;
  surfaces?: string[];
  notes?: string;
  treatmentStatus?: "planned" | "in_progress" | "completed";
}

export function DentalChart({
  readonly = false,
  selected = [],
  conditions = [],
  onToothClick,
}: {
  readonly?: boolean;
  selected?: string[];
  conditions?: ToothCondition[];
  onToothClick?: (tooth: string, condition?: ToothCondition) => void;
}) {
  const [active, setActive] = useState<string[]>(selected);
  const value = useMemo(() => active.join(","), [active]);
  
  const conditionMap = useMemo(() => {
    const map: Record<string, ToothCondition> = {};
    conditions.forEach((c) => {
      map[c.toothNumber] = c;
    });
    return map;
  }, [conditions]);

  function toggle(tooth: string) {
    if (readonly) return;
    setActive((current) =>
      current.includes(tooth)
        ? current.filter((item) => item !== tooth)
        : [...current, tooth]
    );
    onToothClick?.(tooth, conditionMap[tooth]);
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Intraoral Chart</h3>
            <p className="text-sm text-slate-500">
              {readonly ? "View-only dental chart" : "Click teeth to chart conditions"}
            </p>
          </div>
          {!readonly && (
            <div className="text-xs text-slate-500">
              {active.length} tooth/teeth selected
            </div>
          )}
        </div>

        <input type="hidden" name="tooth" value={value} />
        
        {/* Upper arch */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-medium text-slate-600">UPPER ARCH</p>
          <div className="grid grid-cols-8 gap-2">
            {teeth.slice(0, 16).map((tooth) => {
              const isActive = active.includes(tooth);
              const condition = conditionMap[tooth];
              const colorClass = condition
                ? conditionColors[condition.type]
                : "border-slate-200 bg-slate-50";
              
              return (
                <button
                  key={tooth}
                  type="button"
                  onClick={() => toggle(tooth)}
                  disabled={readonly}
                  className={`relative aspect-square rounded-xl border text-sm font-semibold transition ${
                    isActive
                      ? "border-sky-600 ring-2 ring-sky-300"
                      : "border-slate-200"
                  } ${
                    condition ? colorClass : "bg-slate-50 text-slate-700"
                  } ${readonly ? "cursor-default" : "cursor-pointer hover:border-slate-400"}`}
                  title={condition ? `${condition.type} (${condition.treatmentStatus || "planned"})` : ""}
                >
                  {tooth}
                  {condition && (
                    <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-white opacity-75" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lower arch */}
        <div>
          <p className="mb-2 text-xs font-medium text-slate-600">LOWER ARCH</p>
          <div className="grid grid-cols-8 gap-2">
            {teeth.slice(16, 32).map((tooth) => {
              const isActive = active.includes(tooth);
              const condition = conditionMap[tooth];
              const colorClass = condition
                ? conditionColors[condition.type]
                : "border-slate-200 bg-slate-50";
              
              return (
                <button
                  key={tooth}
                  type="button"
                  onClick={() => toggle(tooth)}
                  disabled={readonly}
                  className={`relative aspect-square rounded-xl border text-sm font-semibold transition ${
                    isActive
                      ? "border-sky-600 ring-2 ring-sky-300"
                      : "border-slate-200"
                  } ${
                    condition ? colorClass : "bg-slate-50 text-slate-700"
                  } ${readonly ? "cursor-default" : "cursor-pointer hover:border-slate-400"}`}
                  title={condition ? `${condition.type} (${condition.treatmentStatus || "planned"})` : ""}
                >
                  {tooth}
                  {condition && (
                    <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-white opacity-75" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="rounded-lg bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Condition Legend</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Object.entries(conditionColors).map(([condition, color]) => (
            <div key={condition} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded ${color}`} />
              <span className="text-xs text-slate-700 capitalize">
                {condition.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
