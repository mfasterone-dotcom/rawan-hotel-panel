'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { routing, isValidLocale } from '@/i18n/routing';

export function HtmlAttributes() {
  const pathname = usePathname();

  useEffect(() => {
    // Extract locale from pathname (first segment after /)
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] && isValidLocale(segments[0])
      ? segments[0]
      : routing.defaultLocale;

    // Update html attributes
    if (document.documentElement) {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  }, [pathname]);

  return null;
}

