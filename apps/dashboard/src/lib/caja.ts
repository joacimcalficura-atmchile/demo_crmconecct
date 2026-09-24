// ============================================================
// Caja en Vivo — tipos y utilidades compartidas entre el terminal
// del cajero (/dashboard/caja) y la pantalla del cliente (/caja/[code]).
// La sincronización viaja por Supabase Realtime *Broadcast* (pub/sub
// efímero, sin tabla ni RLS): el cajero emite el estado del carrito y
// la pantalla del cliente lo refleja al instante en otro dispositivo.
// ============================================================

export const IVA_RATE = 0.19;

export interface CajaItem {
  id: string;          // id del ítem del catálogo (o uuid temporal)
  name: string;
  unit: string;
  unit_price: number;  // precio NETO por unidad (igual que Cotizaciones)
  qty: number;
}

export type CajaStatus = 'idle' | 'active' | 'paid';

export interface CajaState {
  items: CajaItem[];
  status: CajaStatus;
  business: string;    // nombre de la empresa (branding en pantalla cliente)
  updatedAt: number;   // epoch ms — para descartar mensajes viejos
}

export const emptyCajaState = (business = ''): CajaState => ({
  items: [],
  status: 'idle',
  business,
  updatedAt: Date.now(),
});

export const clp = (n: number) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;

// Un canal por código de sesión. El código va en la URL de la pantalla
// del cliente, así el dueño abre /caja/AB12 en su pantalla o celular.
export const cajaChannel = (code: string) => `caja-live-${code.trim().toLowerCase()}`;

export function cartTotals(items: CajaItem[]) {
  const net = items.reduce((a, i) => a + i.unit_price * i.qty, 0);
  const tax = Math.round(net * IVA_RATE);
  const total = net + tax;
  const count = items.reduce((a, i) => a + i.qty, 0);
  return { net, tax, total, count };
}

// Código corto y legible (sin caracteres ambiguos) para la sesión de caja.
export function makeCajaCode(len = 4): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
