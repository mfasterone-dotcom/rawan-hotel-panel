'use client';

import { NextIntlClientProvider } from 'next-intl';
import { routing } from '@/i18n/routing';
import { ReactNode } from 'react';

// Provide minimal messages for auth pages during SSR
const messages = {};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider messages={messages} locale={routing.defaultLocale}>
      {children}
    </NextIntlClientProvider>
  );
}

