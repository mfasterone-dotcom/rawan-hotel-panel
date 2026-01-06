'use client';

import { StatCard } from '@/components/shared/stat-card';
import { useStatistics } from '@/hooks/use-statistics';
import { Calendar, DollarSign, Hotel, TrendingUp } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function DashboardPage() {
  const { data: statistics, isLoading } = useStatistics();
  const t = useTranslations('dashboard');
  const tStats = useTranslations('dashboard.stats');
  const locale = useLocale();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
        <StatCard
          title={tStats('totalRooms')}
          value={statistics?.totalRooms ?? 0}
          description={tStats('totalRoomsDescription')}
          icon={Hotel}
          isLoading={isLoading}
        />
        <StatCard
          title={tStats('availableRooms')}
          value={statistics?.totalAvailablesRooms ?? 0}
          description={tStats('availableRoomsDescription')}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <StatCard
          title={tStats('confirmedBookings')}
          value={statistics?.totalConfirmedBooking ?? 0}
          description={tStats('confirmedBookingsDescription')}
          icon={Calendar}
          isLoading={isLoading}
        />
        <StatCard
          title={tStats('pendingBookings')}
          value={statistics?.totalPendingBooking ?? 0}
          description={tStats('pendingBookingsDescription')}
          icon={Calendar}
          isLoading={isLoading}
        />
        <StatCard
          title={tStats('totalRevenue')}
          value={formatCurrency(statistics?.totalMoney ?? 0)}
          description={tStats('totalRevenueDescription')}
          icon={DollarSign}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
