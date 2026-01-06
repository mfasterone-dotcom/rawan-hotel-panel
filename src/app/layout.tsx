import { routing } from '@/i18n/routing';
import { Geist, Geist_Mono } from 'next/font/google';
import { HtmlAttributes } from '@/components/shared/html-attributes';
import QueryProvider from '@/components/providers/query-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Next.js 15 requires html and body tags in root layout
  // suppressHydrationWarning is needed to prevent hydration warnings
  // HtmlAttributes component updates lang and dir based on locale
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <HtmlAttributes />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
