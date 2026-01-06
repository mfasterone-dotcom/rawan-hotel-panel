'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Calendar, CalendarDays, CreditCard, Download, Home, Hotel, LogOut, Menu, Settings, Star, User } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { useEffect, useState } from 'react';
import { useLogout } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useLogout();
  const t = useTranslations('dashboard.navigation');

  // Add class to html element to enable overflow-y: hidden for dashboard
  useEffect(() => {
    document.documentElement.classList.add('dashboard-overflow-hidden');
    return () => {
      document.documentElement.classList.remove('dashboard-overflow-hidden');
    };
  }, []);

  const tCalendar = useTranslations('calendar');
  const navItems = [
    { href: '/', label: t('dashboard'), icon: Home },
    { href: '/rooms', label: t('rooms'), icon: Hotel },
    { href: '/rooms-importer', label: t('roomsImporter'), icon: Download },
    { href: '/bookings', label: t('bookings'), icon: Calendar },
    { href: '/calendar', label: tCalendar('title'), icon: CalendarDays },
    { href: '/reviews', label: t('reviews'), icon: Star },
    { href: '/payout', label: t('payout'), icon: CreditCard },
    { href: '/settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } border-e bg-card transition-all duration-300 overflow-hidden`}
      >
        <div className='flex h-full flex-col'>
          <div className='flex h-16 items-center border-b px-6'>
            <h1 className='text-xl font-bold'>Rawana Hotels</h1>
          </div>
          <nav className='flex-1 space-y-1 p-4'>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className='w-full justify-start'
                  >
                    <Icon className='me-2 h-4 w-4' />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
          <div className='border-t p-4'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='w-full justify-start'>
                  <User className='me-2 h-4 w-4' />
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56'>
                <DropdownMenuLabel>{t('account')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className='me-2 h-4 w-4' />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <header className='flex h-16 items-center border-b bg-card px-6'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className='me-4'
          >
            <Menu className='h-5 w-5' />
          </Button>
          <div className='flex flex-1 items-center justify-between'>
            <h2 className='text-lg font-semibold'>
              {navItems.find(item => item.href === pathname)?.label || t('dashboard')}
            </h2>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto p-6'>{children}</main>
      </div>
    </div>
  );
}
