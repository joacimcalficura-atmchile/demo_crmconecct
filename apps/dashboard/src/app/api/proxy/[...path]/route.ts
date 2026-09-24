import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/require-session';
import { getDemoMutation, getDemoPayload } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function demoRequest(req: NextRequest, params: Promise<{ path: string[] }>) {
  const token = await requireSession(req);
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { path } = await params;
  const endpoint = '/api/' + path.join('/');
  let body: unknown;
  if (req.method !== 'GET') {
    try { body = await req.json(); } catch { body = undefined; }
  }

  const payload = req.method === 'GET'
    ? getDemoPayload(endpoint)
    : getDemoMutation(endpoint, req.method, body);

  const status = payload && typeof payload === 'object' && 'error' in payload ? 501 : 200;
  return NextResponse.json(payload, { status, headers: { 'X-ATM-Demo': 'simulated' } });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, context: RouteContext) { return demoRequest(req, context.params); }
export async function POST(req: NextRequest, context: RouteContext) { return demoRequest(req, context.params); }
export async function PATCH(req: NextRequest, context: RouteContext) { return demoRequest(req, context.params); }
export async function PUT(req: NextRequest, context: RouteContext) { return demoRequest(req, context.params); }
export async function DELETE(req: NextRequest, context: RouteContext) { return demoRequest(req, context.params); }
