import createMiddleware from 'next-intl/middleware';
import { hasLocale } from 'next-intl';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { getRequestCountryCode } from '@/lib/server/request-country';
import { DEFAULT_YOUTUBE_HOT_REGION_CODES } from '@/lib/youtube-hot/default-regions';

const handleI18nRouting = createMiddleware(routing);
const youtubeHotRegionSet = new Set<string>(DEFAULT_YOUTUBE_HOT_REGION_CODES);

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/') {
    return handleI18nRouting(request);
  }

  const segment = pathname.split('/')[1];
  if (!hasLocale(routing.locales, segment)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/en${pathname}`;
    return NextResponse.redirect(redirectUrl, 301);
  }

  const barePath = pathname.split('/').slice(2).join('/');
  if (barePath === 'youtube-trending' && !searchParams.has('region')) {
    const redirectUrl = request.nextUrl.clone();
    const requestCountryCode = getRequestCountryCode(request.headers);
    const defaultRegion =
      requestCountryCode && youtubeHotRegionSet.has(requestCountryCode) ? requestCountryCode : 'all';

    redirectUrl.searchParams.set('region', defaultRegion);
    return NextResponse.redirect(redirectUrl, 307);
  }

  return handleI18nRouting(request);
}

export default proxy;

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};
