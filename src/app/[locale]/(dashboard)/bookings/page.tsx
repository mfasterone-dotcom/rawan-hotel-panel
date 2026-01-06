'use client';

import { TableSkeleton } from '@/components/shared/table-skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApproveBooking, useBookings, useRejectBooking } from '@/hooks/use-bookings';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

export default function BookingsPage() {
  const { data: bookings = [], isLoading } = useBookings();
  const approveBookingMutation = useApproveBooking();
  const rejectBookingMutation = useRejectBooking();
  const t = useTranslations('bookings');
  const locale = useLocale();
  const [rejectingBooking, setRejectingBooking] = useState<{
    id: number;
    cancelReason: string;
  } | null>(null);

  const handleApprove = async (bookingId: number) => {
    try {
      await approveBookingMutation.mutateAsync(bookingId);
      toast.success(t('toasts.approved'));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('toasts.approvalFailed');
      toast.error(t('toasts.approvalFailed'), {
        description: errorMessage,
      });
    }
  };

  const handleReject = async () => {
    if (!rejectingBooking) return;
    try {
      await rejectBookingMutation.mutateAsync({
        bookingId: rejectingBooking.id,
        data: {
          cancelReason: rejectingBooking.cancelReason || undefined,
        },
      });
      toast.success(t('toasts.rejected'));
      setRejectingBooking(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('toasts.rejectionFailed');
      toast.error(t('toasts.rejectionFailed'), {
        description: errorMessage,
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'success';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US');
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>{t('title')}</h1>
            <p className='text-muted-foreground'>{t('subtitle')}</p>
          </div>
        </div>
        <div className='rounded-md border p-4'>
          <TableSkeleton rows={5} columns={9} />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>{t('title')}</h1>
          <p className='text-muted-foreground'>{t('subtitle')}</p>
        </div>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.id')}</TableHead>
              <TableHead>{t('table.property')}</TableHead>
              <TableHead>{t('table.checkIn')}</TableHead>
              <TableHead>{t('table.checkOut')}</TableHead>
              <TableHead>{t('table.subtotal')}</TableHead>
              <TableHead>{t('table.tax')}</TableHead>
              <TableHead>{t('table.total')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className='text-right'>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='text-center py-8 text-muted-foreground'>
                  {t('table.noBookings')}
                </TableCell>
              </TableRow>
            ) : (
              bookings.map(booking => (
                <TableRow key={booking.id}>
                  <TableCell className='font-medium'>{booking.id}</TableCell>
                  <TableCell>{booking.propTitle}</TableCell>
                  <TableCell>{formatDate(booking.checkIn)}</TableCell>
                  <TableCell>{formatDate(booking.checkOut)}</TableCell>
                  <TableCell>{formatCurrency(booking.subtotal)}</TableCell>
                  <TableCell>{formatCurrency(booking.tax)}</TableCell>
                  <TableCell className='font-semibold'>{formatCurrency(booking.total)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.bookStatus)}>
                      {booking.bookStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleApprove(booking.id)}
                        disabled={
                          approveBookingMutation.isPending || booking.bookStatus !== 'Booked'
                        }
                        className='h-8'
                      >
                        <CheckCircle2 className='mr-2 h-4 w-4 text-green-600' />
                        {t('table.approve')}
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => setRejectingBooking({ id: booking.id, cancelReason: '' })}
                        disabled={
                          rejectBookingMutation.isPending || booking.bookStatus !== 'Booked'
                        }
                        className='h-8'
                      >
                        <XCircle className='mr-2 h-4 w-4' />
                        {t('table.reject')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject Booking Dialog */}
      {rejectingBooking && (
        <Dialog open={!!rejectingBooking} onOpenChange={() => setRejectingBooking(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('reject.title')}</DialogTitle>
              <DialogDescription>
                {t('reject.description')}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='cancelReason'>{t('reject.cancelReason')}</Label>
                <Input
                  id='cancelReason'
                  placeholder={t('reject.cancelReasonPlaceholder')}
                  value={rejectingBooking.cancelReason}
                  onChange={e =>
                    setRejectingBooking({
                      ...rejectingBooking,
                      cancelReason: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setRejectingBooking(null)}
                disabled={rejectBookingMutation.isPending}
              >
                {t('reject.cancel')}
              </Button>
              <Button
                variant='destructive'
                onClick={handleReject}
                disabled={rejectBookingMutation.isPending}
              >
                {rejectBookingMutation.isPending ? t('reject.rejecting') : t('reject.rejectBooking')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
