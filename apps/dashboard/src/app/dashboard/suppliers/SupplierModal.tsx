'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Store, PackageOpen, MapPin, Tag } from 'lucide-react';
import { Supplier } from '@/lib/api';

async function proxyFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  supplier?: Supplier;
}

export function SupplierModal({ isOpen, onClose, onSaved, supplier }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({});

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData(supplier);
      } else {
        setFormData({
          name: '',
          contact_name: '',
          phone: '',
          email: '',
          category: '',
          address: '',
          products_services: '',
          notes: ''
        });
      }
    }
  }, [isOpen, supplier]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('El nombre del proveedor es obligatorio');

    setLoading(true);
    try {
      if (supplier?.id) {
        await proxyFetch(`/suppliers/${supplier.id}`, { method: 'PATCH', body: JSON.stringify(formData) });
      } else {
        await proxyFetch('/suppliers', { method: 'POST', body: JSON.stringify(formData) });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Error guardando proveedor');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof Supplier, label: string, placeholder: string, type = 'text', icon?: any) => {
    const Icon = icon;
    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-500" />}
          <input
            type={type}
            value={(formData[key] as string) || ''}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            placeholder={placeholder}
            className={`w-full ${Icon ? 'pl-9' : 'px-3'} pr-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-300 dark:border-emerald-500/20">
              <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Completa los datos para alimentar el conocimiento de la IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              {field('name', 'Nombre de la Empresa / Marca', 'Ej: Sodimac, Easy...', 'text', Store)}
            </div>
            
            {field('contact_name', 'Nombre del Contacto', 'Ej: Juan Pérez (Vendedor)')}
            {field('phone', 'Teléfono / WhatsApp', '+56 9 1234 5678')}
            {field('email', 'Correo Electrónico', 'ventas@empresa.cl', 'email')}
            {field('category', 'Categoría Principal', 'Ej: Materiales, Aseo, Insumos', 'text', Tag)}
            
            <div className="sm:col-span-2">
              {field('address', 'Dirección / Ubicación', 'Ej: Av. Vicuña Mackenna 1234, Santiago', 'text', MapPin)}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <PackageOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Productos y Valores (Para IA)
            </label>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mb-2">Escribe los productos principales y sus precios de referencia. El agente de IA leerá esto para responder consultas. (Ej: "Cemento Bio-Bio: $4.500 c/u, Yeso 1kg: $1.200")</p>
            <textarea
              value={formData.products_services || ''}
              onChange={(e) => setFormData({ ...formData, products_services: e.target.value })}
              placeholder="Detalla los productos y precios aquí..."
              className="w-full px-4 py-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 min-h-[120px] resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notas Internas</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Condiciones de despacho, tiempos de entrega, etc..."
              className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 min-h-[60px] resize-y"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
