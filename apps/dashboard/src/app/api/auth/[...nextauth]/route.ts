import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, ctx: any) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) {
    process.env.NEXTAUTH_URL = `https://${host}`;
  }
  return NextAuth(authOptions)(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) {
    process.env.NEXTAUTH_URL = `https://${host}`;
  }
  return NextAuth(authOptions)(req, ctx);
}
