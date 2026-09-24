'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Receipt, Image as ImageIcon, Edit2, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CashFlow } from '@/lib/api';

export function CashFlowRowActions({ entry, onUpdate }: { entry: CashFlow, onUpdate?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse date for input type="date"
  const isoDate = new Date(entry.entry_date).toISOString().split('T')[0];

  // Edit state
  const [editData, setEditData] = useState({
    amount: entry.amount,
    tax_amount: entry.tax_amount || 0,
    counterparty: entry.counterparty || '',
    folio: entry.folio || '',
    entry_date: isoDate,
    document_type: entry.document_type || '',
    items_json: entry.items_json ? JSON.parse(JSON.stringify(entry.items_json)) : [],
  });

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editData.items_json];
    newItems[index] = { ...newItems[index], [field]: value };
    // Auto-calc total if qty and price change
    if (field === 'quantity' || field === 'unit_price') {
      const q = newItems[index].quantity || 0;
      const p = newItems[index].unit_price || 0;
      if (q && p) {
        newItems[index].total = q * p;
      }
    }
    setEditData({ ...editData, items_json: newItems });
  };

  const handleAddItem = () => {
    setEditData({
      ...editData,
      items_json: [...editData.items_json, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...editData.items_json];
    newItems.splice(index, 1);
    setEditData({ ...editData, items_json: newItems });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        amount: editData.amount,
        tax_amount: editData.tax_amount || null,
        counterparty: editData.counterparty || null,
        folio: editData.folio || null,
        document_type: editData.document_type || null,
        entry_date: new Date(editData.entry_date).toISOString(),
        items_json: editData.items_json.length > 0 ? editData.items_json : null,
      };

      const res = await fetch(`/api/proxy/finance/cash-flow/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error saving');
      
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error updating entry:', err);
      alert('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Ver detalles"
        className="p-2 rounded-full transition-all duration-300 text-blue-600 bg-blue-50/50 hover:bg-blue-100 hover:shadow-sm border border-transparent hover:border-blue-200 cursor-pointer"
      >
        <Eye className="w-4 h-4" />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-3xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-500" />
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100/50 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.counterparty}
                        onChange={(e) => setEditData({...editData, counterparty: e.target.value})}
                        className="font-bold text-slate-900 text-lg tracking-tight bg-slate-100 border border-slate-200 rounded px-2 py-1 w-full outline-none focus:border-blue-400"
                        placeholder="Proveedor"
                      />
                    ) : (
                      <h3 className="font-bold text-slate-900 text-lg tracking-tight truncate">
                        {entry.counterparty || 'Sin proveedor'}
                      </h3>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.entry_date}
                          onChange={(e) => setEditData({...editData, entry_date: e.target.value})}
                          className="text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 outline-none focus:border-blue-400"
                        />
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">
                          {new Date(entry.entry_date).toLocaleDateString('es-CL')}
                        </p>
                      )}
                      
                      {isEditing ? (
                        <select
                          value={editData.document_type}
                          onChange={(e) => setEditData({...editData, document_type: e.target.value})}
                          className="text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-blue-400"
                        >
                          <option value="">Tipo Doc.</option>
                          <option value="Factura">Factura</option>
                          <option value="Boleta">Boleta</option>
                          <option value="Recibo">Recibo</option>
                          <option value="Otro">Otro</option>
                        </select>
                      ) : (
                        entry.document_type && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                            {entry.document_type}
                          </span>
                        )
                      )}

                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.folio}
                          onChange={(e) => setEditData({...editData, folio: e.target.value})}
                          className="text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded px-1 py-0.5 w-24 outline-none focus:border-blue-400"
                          placeholder="Nº Folio"
                        />
                      ) : (
                        entry.folio && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                            Nº {entry.folio}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.receipt_url && !isEditing ? (
                    <div className="flex items-center gap-1">
                      <a
                        href={entry.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-l-lg transition-colors border border-sky-100/50"
                        title="Ver respaldo"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Ver
                      </a>
                      <a
                        href={entry.receipt_url}
                        download={`Respaldo_${entry.folio || entry.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-r-lg transition-colors border border-sky-100/50 border-l-sky-200"
                        title="Descargar respaldo"
                        onClick={async (e) => {
                          e.preventDefault();
                          try {
                            const res = await fetch(entry.receipt_url!);
                            const blob = await res.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Respaldo_${entry.folio || 'ATM'}`;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                          } catch(err) {
                            window.open(entry.receipt_url!, '_blank');
                          }
                        }}
                      >
                        Descargar
                      </a>
                    </div>
                  ) : !isEditing && (
                    <button
                      disabled
                      title="Este registro antiguo no tiene imagen respaldada."
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-400 bg-slate-50 rounded-lg border border-slate-100 cursor-not-allowed opacity-70"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Sin Respaldo
                    </button>
                  )}
                  {isEditing ? (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Guardar
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsEditing(false);
                    }}
                    className="p-2.5 ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-full transition-colors bg-slate-50/50 border border-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100/80 overflow-hidden shadow-inner overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100/50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-wider font-bold">
                        <th className="text-left py-3.5 px-5">Descripción</th>
                        <th className="text-right py-3.5 px-5 w-24">Cant.</th>
                        <th className="text-right py-3.5 px-5 w-32">Precio Unit.</th>
                        <th className="text-right py-3.5 px-5 w-32">Total</th>
                        {isEditing && <th className="w-10"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {editData.items_json.length > 0 ? (
                        editData.items_json.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-white/80 transition-colors group">
                            <td className="py-3 px-5 font-medium text-slate-800">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={item.description}
                                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-blue-400"
                                  placeholder="Item"
                                />
                              ) : (
                                item.description
                              )}
                            </td>
                            <td className="py-3 px-5 text-right font-mono text-slate-500">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  value={item.quantity || ''}
                                  onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-right outline-none focus:border-blue-400"
                                />
                              ) : (
                                item.quantity ?? '-'
                              )}
                            </td>
                            <td className="py-3 px-5 text-right font-mono text-slate-500">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  value={item.unit_price || ''}
                                  onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-right outline-none focus:border-blue-400"
                                />
                              ) : (
                                item.unit_price ? `$${item.unit_price.toLocaleString('es-CL')}` : '-'
                              )}
                            </td>
                            <td className="py-3 px-5 text-right font-mono font-semibold text-slate-900">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  value={item.total || ''}
                                  onChange={(e) => handleItemChange(idx, 'total', Number(e.target.value))}
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-right font-semibold outline-none focus:border-blue-400"
                                />
                              ) : (
                                item.total ? `$${item.total.toLocaleString('es-CL')}` : '-'
                              )}
                            </td>
                            {isEditing && (
                              <td className="py-3 pr-2 text-center">
                                <button onClick={() => handleRemoveItem(idx)} className="text-rose-400 hover:text-rose-600 p-1">
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={isEditing ? 5 : 4} className="py-6 text-center text-slate-400 font-medium">
                            No hay desglose de items para este movimiento.
                          </td>
                        </tr>
                      )}
                      
                      {isEditing && (
                        <tr>
                          <td colSpan={5} className="py-3 px-5">
                            <button 
                              onClick={handleAddItem}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                            >
                              + Agregar Ítem
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-t border-slate-200/60">
                      <tr>
                        <td colSpan={3} className="py-4 px-5 text-right font-bold text-slate-500 text-xs uppercase tracking-wider">
                          Total Movimiento
                        </td>
                        <td className="py-3 px-5 text-right font-extrabold text-blue-600 text-lg font-mono" colSpan={isEditing ? 2 : 1}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editData.amount}
                              onChange={(e) => setEditData({...editData, amount: Number(e.target.value)})}
                              className="text-right bg-white border border-blue-200 rounded px-2 py-1 w-28 text-blue-700 outline-none focus:border-blue-400"
                            />
                          ) : (
                            `$${entry.amount.toLocaleString('es-CL')}`
                          )}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td colSpan={3} className="py-2 px-5 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider border-t border-slate-100">
                          IVA Incluido
                        </td>
                        <td className="py-2 px-5 text-right font-bold text-slate-600 text-sm font-mono border-t border-slate-100" colSpan={isEditing ? 2 : 1}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={editData.tax_amount}
                              onChange={(e) => setEditData({...editData, tax_amount: Number(e.target.value)})}
                              className="text-right bg-white border border-slate-200 rounded px-2 py-1 w-24 text-slate-700 outline-none focus:border-slate-400"
                            />
                          ) : (
                            editData.tax_amount ? `$${editData.tax_amount.toLocaleString('es-CL')}` : '-'
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
