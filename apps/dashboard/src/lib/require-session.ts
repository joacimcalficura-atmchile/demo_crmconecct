import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function requireSession(req: NextRequest) {
  // Intentar primero con la configuración por defecto de NextAuth (autodetecta secureCookie)
  let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    // Fallback manual: a veces Vercel detrás del proxy pierde el protocolo y falla la autodetección
    // Forzamos la lectura de la cookie segura explícitamente
    token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET, 
      secureCookie: true 
    });
  }

  if (!token) {
    // Fallback manual 2: Forzar cookie no segura por si acaso el entorno local/preview la generó así
    token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET, 
      secureCookie: false 
    });
  }

  return token; // null si definitivamente no hay sesión válida
}
