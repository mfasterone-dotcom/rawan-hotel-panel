import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/register'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // Extract locale from pathname (e.g., /en/login or /ar/login)
  const pathnameHasLocale = routing.locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If no locale in pathname, redirect to default locale
  if (!pathnameHasLocale && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const locale = routing.defaultLocale;
    const newUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Handle auth logic
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(route + '/'));

  if (token) {
    if (isPublicRoute) {
      const locale = pathname.split('/')[1] || routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    // Continue with intl middleware
    return intlMiddleware(request);
  }

  if (isPublicRoute) {
    // Continue with intl middleware
    return intlMiddleware(request);
  }

  // Redirect to login with locale
  const locale = pathname.split('/')[1] || routing.defaultLocale;
  return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|uploads|images|.*\\..*).*)'],
};
