'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PriceAdjustmentDialog } from './price-adjustment-dialog';
import { AvailabilityChangeDialog } from './availability-change-dialog';

const parseISO = (dateString: string) => {
  return new Date(dateString);
};

const format = (date: Date, formatStr: string) => {
  if (formatStr === 'EEEE, MMMM d, yyyy') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return date.toLocaleDateString();
};

interface Booking {
  id: number;
  propTitle: string;
  checkIn: string;
  checkOut: string;
  bookStatus: string;
  total: number;
}

interface CalendarSidePanelProps {
  selectedDate: Date;
  bookings: Booking[];
  onDateSelect: (date: Date) => void;
  selectedDays: Set<string>;
  selectedRoomId: number | null;
  selectedRoom?: {
    priceIncreaseRanges?: Array<{ startDate?: string; StartDate?: string; endDate?: string; EndDate?: string }>;
    priceDecreaseRanges?: Array<{ startDate?: string; StartDate?: string; endDate?: string; EndDate?: string }>;
  } | null;
  onClearSelectedDays?: () => void;
}

export function CalendarSidePanel({
  selectedDate,
  bookings,
  onDateSelect,
  selectedDays,
  selectedRoomId,
  selectedRoom,
  onClearSelectedDays,
}: CalendarSidePanelProps) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const [increaseDialogOpen, setIncreaseDialogOpen] = useState(false);
  const [decreaseDialogOpen, setDecreaseDialogOpen] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);

  // Check if selected days have conflicts
  const hasIncreaseConflict = () => {
    if (!selectedRoom?.priceDecreaseRanges || selectedDays.size === 0) return false;
    for (const dayKey of selectedDays) {
      const day = new Date(dayKey + 'T00:00:00');
      for (const range of selectedRoom.priceDecreaseRanges) {
        const startDate = (range as any).startDate || (range as any).StartDate;
        const endDate = (range as any).endDate || (range as any).EndDate;
        if (startDate && endDate) {
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T00:00:00');
          if (day >= start && day <= end) return true;
        }
      }
    }
    return false;
  };

  const hasDecreaseConflict = () => {
    if (!selectedRoom?.priceIncreaseRanges || selectedDays.size === 0) return false;
    for (const dayKey of selectedDays) {
      const day = new Date(dayKey + 'T00:00:00');
      for (const range of selectedRoom.priceIncreaseRanges) {
        const startDate = (range as any).startDate || (range as any).StartDate;
        const endDate = (range as any).endDate || (range as any).EndDate;
        if (startDate && endDate) {
          const start = new Date(startDate + 'T00:00:00');
          const end = new Date(endDate + 'T00:00:00');
          if (day >= start && day <= end) return true;
        }
      }
    }
    return false;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Confirmed':
      case 'Completed':
        return 'default';
      case 'Booked':
      case 'Check_in':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Filter bookings for the selected date
  const dayBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.checkIn);
    const checkOut = parseISO(booking.checkOut);
    return selectedDate >= checkIn && selectedDate <= checkOut;
  });

  return (
    <div className='w-80'>
      <Card>
        <CardHeader>
          <CardTitle>{t('sidePanel.title')}</CardTitle>
          <p className='text-sm text-muted-foreground'>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </CardHeader>
        <CardContent>
          {selectedDays.size > 0 && selectedRoomId && (
            <div className='mb-4 p-4 border rounded-lg bg-muted/50'>
              <p className='text-sm font-medium mb-3'>
                {selectedDays.size} day{selectedDays.size !== 1 ? 's' : ''} selected
              </p>
                <div className='flex flex-col gap-2'>
                <div className='flex gap-2'>
                  <Button
                    variant='default'
                    size='sm'
                    onClick={() => setIncreaseDialogOpen(true)}
                    className='flex-1'
                    disabled={hasIncreaseConflict()}
                    title={hasIncreaseConflict() ? 'Some selected days already have a price decrease applied' : ''}
                  >
                    Increase
                  </Button>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setDecreaseDialogOpen(true)}
                    className='flex-1'
                    disabled={hasDecreaseConflict()}
                    title={hasDecreaseConflict() ? 'Some selected days already have a price increase applied' : ''}
                  >
                    Decrease
                  </Button>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setAvailabilityDialogOpen(true)}
                  className='w-full'
                >
                  Change Availability
                </Button>
              </div>
            </div>
          )}
          <ScrollArea className='h-[600px]'>
            {dayBookings.length === 0 ? (
              <div className='text-center text-muted-foreground py-8'>
                {t('sidePanel.noBookings')}
              </div>
            ) : (
              <div className='space-y-4'>
                {dayBookings.map(booking => (
                  <div
                    key={booking.id}
                    className='p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors'
                    onClick={() => onDateSelect(parseISO(booking.checkIn))}
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <h4 className='font-semibold text-sm'>{booking.propTitle}</h4>
                      <Badge variant={getStatusBadgeVariant(booking.bookStatus)}>
                        {booking.bookStatus}
                      </Badge>
                    </div>
                    <div className='space-y-1 text-sm text-muted-foreground'>
                      <div>
                        <span className='font-medium'>{t('sidePanel.checkIn')}:</span>{' '}
                        {formatDate(booking.checkIn)}
                      </div>
                      <div>
                        <span className='font-medium'>{t('sidePanel.checkOut')}:</span>{' '}
                        {formatDate(booking.checkOut)}
                      </div>
                      <div className='pt-2 border-t'>
                        <span className='font-medium'>{t('sidePanel.total')}:</span>{' '}
                        <span className='text-foreground font-semibold'>
                          {formatCurrency(booking.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <PriceAdjustmentDialog
        open={increaseDialogOpen}
        onOpenChange={setIncreaseDialogOpen}
        type='increase'
        selectedDays={selectedDays}
        roomId={selectedRoomId}
        room={selectedRoom}
        onSuccess={() => {
          onClearSelectedDays?.();
        }}
      />

      <PriceAdjustmentDialog
        open={decreaseDialogOpen}
        onOpenChange={setDecreaseDialogOpen}
        type='decrease'
        selectedDays={selectedDays}
        roomId={selectedRoomId}
        room={selectedRoom}
        onSuccess={() => {
          onClearSelectedDays?.();
        }}
      />

      <AvailabilityChangeDialog
        open={availabilityDialogOpen}
        onOpenChange={setAvailabilityDialogOpen}
        selectedDays={selectedDays}
        roomId={selectedRoomId}
        onSuccess={() => {
          onClearSelectedDays?.();
        }}
      />
    </div>
  );
}

