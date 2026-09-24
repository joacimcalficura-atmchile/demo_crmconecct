'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Supplier } from '@/lib/api';
import { Store, Plus, Search, MapPin, Tag, Edit2, Trash2, Loader2, Phone, Mail } from 'lucide-react';
import { SupplierModal } from './SupplierModal';

// ─── API helper que usa el proxy seguro de Vercel ────────────────────────────
// CRÍTICO: NO usar api.ts directo porque apiFetch llama a localhost:3001 desde
// el browser, causando ERR_CONNECTION_REFUSED en producción.
// Siempre usar /api/proxy/* desde componentes 'use client'.
async function proxyFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>();

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await proxyFetch<Supplier[]>('/suppliers');
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenCreate = () => {
    setEditingSupplier(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;
    try {
      await proxyFetch(`/suppliers/${id}`, { method: 'DELETE' });
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Error eliminando proveedor');
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.products_services || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1 drop-shadow-sm dark:drop-shadow-md">Proveedores</h1>
          <p className="text-slate-600 dark:text-slate-300 font-medium text-sm drop-shadow-sm">Gestión del ecosistema de abastecimiento y productos</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proveedor
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, producto o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-sm font-medium">Cargando proveedores...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-white/10">
                <Store className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-700 dark:text-slate-300 font-bold text-lg">Sin resultados</p>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">No se encontraron proveedores que coincidan con tu búsqueda o aún no has registrado ninguno.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/5 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                  <th className="p-4 rounded-tl-lg">Proveedor / Contacto</th>
                  <th className="p-4">Categoría / Ubicación</th>
                  <th className="p-4">Productos y Valores</th>
                  <th className="p-4 text-right rounded-tr-lg">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                <AnimatePresence>
                  {filtered.map(sup => (
                    <motion.tr 
                      key={sup.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" /> {sup.name}
                          </p>
                          {(sup.contact_name || sup.phone || sup.email) && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 mt-2">
                              {sup.contact_name && <p className="font-semibold text-slate-700 dark:text-slate-300">{sup.contact_name}</p>}
                              {sup.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {sup.phone}</p>}
                              {sup.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {sup.email}</p>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top space-y-2">
                        {sup.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                            <Tag className="w-3 h-3" /> {sup.category}
                          </span>
                        )}
                        {sup.address && (
                          <p className="text-xs text-slate-400 flex items-start gap-1 mt-1.5">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                            {sup.address}
                          </p>
                        )}
                      </td>
                      <td className="p-4 align-top max-w-sm">
                        {sup.products_services ? (
                          <div className="bg-black/5 dark:bg-black/20 p-2.5 rounded-lg border border-slate-200 dark:border-white/5">
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                              {sup.products_services}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic">No especificado</span>
                        )}
                      </td>
                      <td className="p-4 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(sup)}
                            className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(sup.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      <SupplierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          setIsModalOpen(false);
          loadSuppliers();
        }}
        supplier={editingSupplier}
      />
    </div>
  );
}
