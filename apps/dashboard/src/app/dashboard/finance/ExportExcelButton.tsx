'use client';

import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportExcelButtonProps {
  data: any[];
  filename: string;
  sheetName?: string;
  buttonText?: string;
}

export function ExportExcelButton({
  data,
  filename,
  sheetName = 'Reporte',
  buttonText = 'Descargar Excel'
}: ExportExcelButtonProps) {
  const handleExport = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-xl transition-all shadow-sm border border-slate-700/50 backdrop-blur-md"
    >
      <Download className="w-4 h-4" />
      {buttonText}
    </button>
  );
}
