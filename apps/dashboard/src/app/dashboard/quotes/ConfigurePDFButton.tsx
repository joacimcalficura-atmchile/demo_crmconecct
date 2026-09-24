'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { PDFSettingsModal } from './PDFSettingsModal';

export function ConfigurePDFButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
      >
        <Palette className="w-4 h-4 text-sky-600" />
        Personalizar PDF Apple Style
      </button>
      <PDFSettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
