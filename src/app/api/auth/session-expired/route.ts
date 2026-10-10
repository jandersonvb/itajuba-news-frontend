import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

/**
 * Target of every 401 in the admin (expired token, deactivated user, password reset). A GET so it
 * can be a redirect; it only ends the session, which is harmless if triggered by someone else.
 */
export function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/admin/login?sessao=expirada', req.nextUrl.origin));
  clearSessionCookie(response);
  return response;
}
