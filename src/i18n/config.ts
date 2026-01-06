// This file is kept for type exports and constants
// The actual request config is in request.ts which next-intl looks for

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
