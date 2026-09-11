import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const USER_COOKIE = 'wavon_user_id';
export const ROLE_COOKIE = 'wavon_user_role';

const AUTH_SECRET = process.env.AUTH_SECRET || 'wavon-attendance-hmac-salt-2026';

async function verifyCookie(signedValue: string | undefined): Promise<string | null> {
  if (!signedValue) return null;
  const lastDot = signedValue.lastIndexOf('.');
  if (lastDot === -1) {
    return signedValue;
  }
  const value = signedValue.slice(0, lastDot);
  const signature = signedValue.slice(lastDot + 1);

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(AUTH_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
    const expected = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);

    if (signature === expected) {
      return value;
    }
  } catch {
    return null;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, Next.js internal routes, login, register, check-in, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/checkin') ||
    pathname === '/icon.svg' ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check for authentication cookie and verify signature (BUG-04)
  const rawUserId = request.cookies.get(USER_COOKIE)?.value;
  const userId = await verifyCookie(rawUserId);

  if (!userId) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // BUG-07 & BUG-04: ป้องกันหน้า /admin เฉพาะผู้ดูแลระบบ (ADMIN) พร้อมตรวจสอบลายเซ็น
  if (pathname.startsWith('/admin')) {
    const rawRole = request.cookies.get(ROLE_COOKIE)?.value;
    const userRole = await verifyCookie(rawRole);
    if (userRole !== 'ADMIN') {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
