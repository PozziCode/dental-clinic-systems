"use client";

import jsPDF from "jspdf";
import Papa from "papaparse";
import { Download, FileText, Printer } from "lucide-react";

export function ReportExportButtons({
  fileName,
  rows,
}: {
  fileName: string;
  rows: Record<string, unknown>[];
}) {
  function exportCsv() {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Dental Clinic Management System", 14, 18);
    doc.setFontSize(11);
    doc.text(fileName, 14, 28);
    rows.slice(0, 30).forEach((row, index) => {
      doc.text(JSON.stringify(row), 14, 40 + index * 8);
    });
    doc.save(`${fileName}.pdf`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={exportCsv}
        className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700"
      >
        <Download className="h-4 w-4" />
        CSV
      </button>
      <button
        type="button"
        onClick={exportPdf}
        className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700"
      >
        <FileText className="h-4 w-4" />
        PDF
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium text-slate-700"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
    </div>
  );
}
