// ============================================================
// Identidad de un contacto por su teléfono — FUENTE ÚNICA del dashboard.
// Vivía duplicado en conversations/ConversationsClient.tsx y en
// leads/KanbanBoard.tsx, y las dos copias ya habían empezado a divergir (una
// reconocía "@lid" y el string vacío, la otra reventaba con undefined). Es
// exactamente el patrón que advierte CLAUDE.md: el umbral del LID llegó a estar
// en 5 lugares. Si hay que cambiar la regla, se cambia acá — y también en el
// bot (`isLidLikely`), que es el otro lado del invariante #3.
// ============================================================

/**
 * Un número chileno real (56 9 XXXXXXXX) son **exactamente 11 dígitos**.
 * Cualquier cosa más larga que no empiece en 56 es un LID de WhatsApp sin
 * resolver, y NO se puede mostrar como si fuera un teléfono (invariantes #3 y
 * #4). El umbral es `> 11`, no `> 13`: con `> 13` se colaban los LIDs de
 * exactamente 13 dígitos (ej. "1220542468260", el caso que originó toda la
 * investigación) haciéndose pasar por números válidos.
 */
export function isUnresolvedLid(phone: string | null | undefined): boolean {
  if (!phone) return false;
  if (phone.includes('@lid')) return true;
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length > 11 && !digits.startsWith('56');
}

/** Etiqueta honesta para un identificador que no es un teléfono verificado. */
export const UNVERIFIED_PHONE_LABEL = 'Número sin verificar';

/** Formatea un número chileno real; cualquier otra cosa se devuelve tal cual. */
export function formatPhone(raw: string | null | undefined): string {
  const d = (raw || '').replace(/[^0-9]/g, '');
  if (d.startsWith('56') && d.length === 11) return `+56 9 ${d.slice(3, 7)} ${d.slice(7)}`;
  return raw ?? '';
}
