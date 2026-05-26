"use client";

import { useEffect, useState } from "react";
import { DentalChart, ToothCondition } from "@/components/shared/DentalChart";
import { Card } from "@/components/ui/card";

interface PatientData {
  first_name: string;
  last_name: string;
  age?: number;
}

export default function PatientChartPage() {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [conditions, setConditions] = useState<ToothCondition[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        // For now, this is a client-side implementation
        // In production, you'd fetch from your API
        const response = await fetch("/api/patient/chart");
        if (response.ok) {
          const data = await response.json();
          setPatient(data.patient);
          setConditions(data.conditions || []);
          setClinicalNotes(data.clinicalNotes || "");
          setTreatmentPlan(data.treatmentPlan || "");
        }
      } catch (error) {
        console.error("Failed to load chart:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Loading your dental chart...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Dental Chart</h1>
        <p className="text-sm text-slate-500">
          Your comprehensive dental health record from {patient ? `${patient.first_name} ${patient.last_name}` : "your dentist"}.
        </p>
      </div>

      {/* Interactive Dental Chart - Read Only */}
      <DentalChart 
        readonly 
        conditions={conditions}
      />

      {/* Clinical Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Clinical Notes */}
        {clinicalNotes && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Clinical Notes
            </h3>
            <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {clinicalNotes}
            </div>
          </Card>
        )}

        {/* Treatment Plan */}
        {treatmentPlan && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Recommended Treatment Plan
            </h3>
            <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              {treatmentPlan}
            </div>
          </Card>
        )}
      </div>

      {/* Chart Summary */}
      {conditions.length > 0 && (
        <Card className="bg-blue-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            Chart Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-slate-600">Total Teeth Charted</p>
              <p className="text-2xl font-bold text-blue-600">{conditions.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Planned Treatments</p>
              <p className="text-2xl font-bold text-blue-600">
                {conditions.filter((c) => c.treatmentStatus === "planned").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {conditions.filter((c) => c.treatmentStatus === "in_progress").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">
                {conditions.filter((c) => c.treatmentStatus === "completed").length}
              </p>
            </div>
          </div>
        </Card>
      )}

      {conditions.length === 0 && (
        <Card className="border-dashed bg-slate-50 p-8 text-center">
          <p className="text-slate-600">
            No chart data available yet. Schedule an appointment with your dentist to get your dental chart created.
          </p>
        </Card>
      )}
    </div>
  );
}
