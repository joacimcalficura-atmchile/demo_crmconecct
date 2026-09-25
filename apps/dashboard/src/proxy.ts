import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse, type NextFetchEvent } from 'next/server';
import { requireSession } from '@/lib/require-session';
import { getDemoMutation, getDemoPayload } from '@/lib/demo-data';

const authMiddleware = withAuth({ pages: { signIn: '/login' } });

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/atm-core')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/api/')) {
    // NextAuth needs its own routes. The proxy catch-all uses fixtures and checks
    // the session itself. Every other API could reach a live integration.
    if (pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/auth/google')) {
      return NextResponse.next();
    }
    // El PDF de una cotización lo abre el cliente final por WhatsApp, sin sesión
    // de dashboard — igual que en producción.
    if (/^\/api\/quotes\/[^/]+\/document\.pdf$/.test(pathname)) {
      return NextResponse.next();
    }
    if (!(await requireSession(request))) {
      return NextResponse.json({ error: 'No autorizado', demo: true }, { status: 401 });
    }
    if (pathname.startsWith('/api/price-catalog')) {
      const body = request.method === 'GET' ? undefined : await request.json().catch(() => undefined);
      if (request.method === 'GET') return NextResponse.json({ items: getDemoPayload('price-catalog') });
      const item = body && typeof body === 'object' ? body : {};
      return NextResponse.json({ ok: true, demo: true, item: { id: 'demo-price-new', ...item } });
    }
    if (pathname.startsWith('/api/calendar/')) {
      if (pathname === '/api/calendar/events' && request.method === 'GET') {
        return NextResponse.json(getDemoPayload('calendar/events'));
      }
      if (pathname === '/api/calendar/recipients' && request.method === 'GET') {
        return NextResponse.json(getDemoPayload('calendar/recipients'));
      }
      return NextResponse.json(getDemoMutation(pathname, request.method), { headers: { 'X-ATM-Demo': 'simulated' } });
    }
    if (pathname === '/api/agent/chat' && request.method === 'POST') {
      return NextResponse.json({ reply: 'Para esta solicitud de muestra, el agente identifica el servicio y pide material, espesor, medidas y cantidad antes de preparar una cotización referencial para revisión humana.', agentsConsulted: ['Asistente de ventas demo'], demo: true });
    }
    if (pathname.startsWith('/api/proxy/') && pathname !== '/api/proxy/debug') {
      return NextResponse.next();
    }
    return NextResponse.json(
      { error: 'Esta integración está desactivada en la demo.', demo: true },
      { status: 503 },
    );
  }

  if (pathname.startsWith('/api/')) return NextResponse.next();

  return authMiddleware(request as never, event);
}

export const config = {
  matcher: ['/dashboard/:path*', '/atm-core/:path*', '/api/:path*'],
};
