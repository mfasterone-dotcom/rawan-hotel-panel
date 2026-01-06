'use client';

import { CalendarView } from './components/calendar-view';
import { useTranslations } from 'next-intl';

export default function CalendarPage() {
  const t = useTranslations('calendar');

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>{t('title')}</h1>
        <p className='text-muted-foreground'>{t('subtitle')}</p>
      </div>
      <CalendarView />
    </div>
  );
}

